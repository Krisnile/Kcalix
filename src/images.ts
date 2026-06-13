// 图片资源集中管理
// ────────────────────────────────────────────────────────────
// 想替换成更好看的图片时，只需把 assets/images/ 下的同名文件覆盖即可，
// 无需改任何代码（建议用正方形 PNG，头像 256x256 以上更清晰）。
//   - logo.png          应用 Logo（启动页 / 引导页）
//   - avatar-male.png    男性头像
//   - avatar-female.png  女性头像
// 如需新增图片：把文件放进 assets/images/，再到下面加一行 require 即可。

export const images = {
  logo: require('../assets/images/logo.png'),
  avatarMale: require('../assets/images/avatar-male.png'),
  avatarFemale: require('../assets/images/avatar-female.png'),
};

export type ImageKey = keyof typeof images;
