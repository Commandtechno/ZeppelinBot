import { utilityCmd, UtilityPluginType } from "../types";
import { commandTypeHelpers as ct } from "../../../commandTypes";
import { DAYS, getInviteCodesInString, noop, SECONDS, stripObjectToScalars } from "../../../utils";
import { getBaseUrl, sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { Message, TextChannel, User } from "eris";
import moment from "moment-timezone";
import { PluginData } from "knub";
import { SavedMessage } from "../../../data/entities/SavedMessage";
import { LogType } from "../../../data/LogType";

const MAX_CLEAN_COUNT = 150;
const MAX_CLEAN_TIME = 1 * DAYS;
const CLEAN_COMMAND_DELETE_DELAY = 5 * SECONDS;

async function cleanMessages(
  pluginData: PluginData<UtilityPluginType>,
  channel: TextChannel,
  savedMessages: SavedMessage[],
  mod: User,
) {
  pluginData.state.logs.ignoreLog(LogType.MESSAGE_DELETE, savedMessages[0].id);
  pluginData.state.logs.ignoreLog(LogType.MESSAGE_DELETE_BULK, savedMessages[0].id);

  // Delete & archive in ID order
  savedMessages = Array.from(savedMessages).sort((a, b) => (a.id > b.id ? 1 : -1));
  const idsToDelete = savedMessages.map(m => m.id);

  // Make sure the deletions aren't double logged
  idsToDelete.forEach(id => pluginData.state.logs.ignoreLog(LogType.MESSAGE_DELETE, id));
  pluginData.state.logs.ignoreLog(LogType.MESSAGE_DELETE_BULK, idsToDelete[0]);

  // Actually delete the messages
  await pluginData.client.deleteMessages(channel.id, idsToDelete);
  await pluginData.state.savedMessages.markBulkAsDeleted(idsToDelete);

  // Create an archive
  const archiveId = await pluginData.state.archives.createFromSavedMessages(savedMessages, pluginData.guild);
  const baseUrl = getBaseUrl(pluginData);
  const archiveUrl = pluginData.state.archives.getUrl(baseUrl, archiveId);

  pluginData.state.logs.log(LogType.CLEAN, {
    mod: stripObjectToScalars(mod),
    channel: stripObjectToScalars(channel),
    count: savedMessages.length,
    archiveUrl,
  });

  return { archiveUrl };
}

export const CleanCmd = utilityCmd({
  trigger: "clean",
  description: "Remove a number of recent messages",
  usage: "!clean 20",
  permission: "can_clean",

  signature: {
    count: ct.number(),

    user: ct.userId({ option: true, shortcut: "u" }),
    channel: ct.channelId({ option: true, shortcut: "c" }),
    bots: ct.switchOption({ shortcut: "b" }),
    "has-invites": ct.switchOption({ shortcut: "i" }),
  },

  async run({ message: msg, args, pluginData }) {
    if (args.count > MAX_CLEAN_COUNT || args.count <= 0) {
      sendErrorMessage(pluginData, msg.channel, `Clean count must be between 1 and ${MAX_CLEAN_COUNT}`);
      return;
    }

    const targetChannel = args.channel ? pluginData.guild.channels.get(args.channel) : msg.channel;
    if (!targetChannel || !(targetChannel instanceof TextChannel)) {
      sendErrorMessage(pluginData, msg.channel, `Invalid channel specified`);
      return;
    }

    if (targetChannel.id !== msg.channel.id) {
      const configForTargetChannel = pluginData.config.getMatchingConfig({
        userId: msg.author.id,
        channelId: targetChannel.id,
      });
      if (configForTargetChannel.can_clean !== true) {
        sendErrorMessage(pluginData, msg.channel, `Missing permissions to use clean on that channel`);
        return;
      }
    }

    const messagesToClean = [];
    let beforeId = msg.id;
    const timeCutoff = msg.timestamp - MAX_CLEAN_TIME;

    while (messagesToClean.length < args.count) {
      const potentialMessagesToClean = await pluginData.state.savedMessages.getLatestByChannelBeforeId(
        targetChannel.id,
        beforeId,
        args.count,
      );
      if (potentialMessagesToClean.length === 0) break;

      const filtered = potentialMessagesToClean.filter(message => {
        if (args.user && message.user_id !== args.user) return false;
        if (args.bots && !message.is_bot) return false;
        if (args["has-invites"] && getInviteCodesInString(message.data.content || "").length === 0) return false;
        if (moment.utc(message.posted_at).valueOf() < timeCutoff) return false;
        return true;
      });
      const remaining = args.count - messagesToClean.length;
      const withoutOverflow = filtered.slice(0, remaining);
      messagesToClean.push(...withoutOverflow);

      beforeId = potentialMessagesToClean[potentialMessagesToClean.length - 1].id;

      if (moment.utc(potentialMessagesToClean[potentialMessagesToClean.length - 1].posted_at).valueOf() < timeCutoff) {
        break;
      }
    }

    let responseMsg: Message;
    if (messagesToClean.length > 0) {
      const cleanResult = await cleanMessages(pluginData, targetChannel, messagesToClean, msg.author);

      let responseText = `Cleaned ${messagesToClean.length} ${messagesToClean.length === 1 ? "message" : "messages"}`;
      if (targetChannel.id !== msg.channel.id) {
        responseText += ` in <#${targetChannel.id}>\n${cleanResult.archiveUrl}`;
      }

      responseMsg = await sendSuccessMessage(pluginData, msg.channel, responseText);
    } else {
      responseMsg = await sendErrorMessage(pluginData, msg.channel, `Found no messages to clean!`);
    }

    if (targetChannel.id === msg.channel.id) {
      // Delete the !clean command and the bot response if a different channel wasn't specified
      // (so as not to spam the cleaned channel with the command itself)
      setTimeout(() => {
        msg.delete().catch(noop);
        responseMsg.delete().catch(noop);
      }, CLEAN_COMMAND_DELETE_DELAY);
    }
  },
});