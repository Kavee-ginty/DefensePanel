export const BEY_PANEL_EMBEDS = [
  'https://bey.chat/14aa8a81-1dce-4ed7-b4d2-e3daf164edc9',
  'https://bey.chat/9f389e69-9392-4757-8511-a618c95c990a',
];

export function getBeyEmbedUrl(index) {
  return BEY_PANEL_EMBEDS[index] ?? BEY_PANEL_EMBEDS[0];
}
