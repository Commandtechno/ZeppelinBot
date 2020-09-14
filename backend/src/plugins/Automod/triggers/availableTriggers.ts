import * as t from "io-ts";
import { MatchWordsTrigger } from "./matchWords";
import { AutomodTriggerBlueprint } from "../helpers";
import { MessageSpamTrigger } from "./messageSpam";
import { MentionSpamTrigger } from "./mentionSpam";
import { LinkSpamTrigger } from "./linkSpam";
import { AttachmentSpamTrigger } from "./attachmentSpam";
import { EmojiSpamTrigger } from "./emojiSpam";
import { LineSpamTrigger } from "./lineSpam";
import { CharacterSpamTrigger } from "./characterSpam";
import { MatchRegexTrigger } from "./matchRegex";
import { MatchInvitesTrigger } from "./matchInvites";
import { MatchLinksTrigger } from "./matchLinks";
import { MatchAttachmentTypeTrigger } from "./matchAttachmentType";
import { MemberJoinSpamTrigger } from "./memberJoinSpam";
import { MemberJoinTrigger } from "./memberJoin";
import { RoleAddedTrigger } from "./roleAdded";
import { RoleRemovedTrigger } from "./roleRemoved";

export const availableTriggers: Record<string, AutomodTriggerBlueprint<any, any>> = {
  match_words: MatchWordsTrigger,
  match_regex: MatchRegexTrigger,
  match_invites: MatchInvitesTrigger,
  match_links: MatchLinksTrigger,
  match_attachment_type: MatchAttachmentTypeTrigger,
  member_join: MemberJoinTrigger,
  role_added: RoleAddedTrigger,
  role_removed: RoleRemovedTrigger,

  message_spam: MessageSpamTrigger,
  mention_spam: MentionSpamTrigger,
  link_spam: LinkSpamTrigger,
  attachment_spam: AttachmentSpamTrigger,
  emoji_spam: EmojiSpamTrigger,
  line_spam: LineSpamTrigger,
  character_spam: CharacterSpamTrigger,
  member_join_spam: MemberJoinSpamTrigger,
};

export const AvailableTriggers = t.type({
  match_words: MatchWordsTrigger.configType,
  match_regex: MatchRegexTrigger.configType,
  match_invites: MatchInvitesTrigger.configType,
  match_links: MatchLinksTrigger.configType,
  match_attachment_type: MatchAttachmentTypeTrigger.configType,
  member_join: MemberJoinTrigger.configType,
  role_added: RoleAddedTrigger.configType,
  role_removed: RoleRemovedTrigger.configType,

  message_spam: MessageSpamTrigger.configType,
  mention_spam: MentionSpamTrigger.configType,
  link_spam: LinkSpamTrigger.configType,
  attachment_spam: AttachmentSpamTrigger.configType,
  emoji_spam: EmojiSpamTrigger.configType,
  line_spam: LineSpamTrigger.configType,
  character_spam: CharacterSpamTrigger.configType,
  member_join_spam: MemberJoinSpamTrigger.configType,
});
