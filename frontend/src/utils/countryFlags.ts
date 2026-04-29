/**
 * CelesTrak 国家代码到 ISO 3166-1 alpha-2 代码映射
 * 用于 flag-icons 库显示国旗
 */
export const CELESTRAK_TO_ISO: Record<string, string> = {
  // 标准 ISO 2字母代码
  US: 'us',
  GB: 'gb',
  FR: 'fr',
  CA: 'ca',
  IT: 'it',
  NZ: 'nz',
  MA: 'ma',
  IM: 'im',
  AC: 'sh', // 阿森松岛属于圣赫勒拿
  AB: 'ag', // 安提瓜和巴布达
  AU: 'au', // 澳大利亚
  AT: 'at', // 奥地利
  BE: 'be', // 比利时
  CH: 'ch', // 瑞士
  CZ: 'cz', // 捷克
  DE: 'de', // 德国
  DK: 'dk', // 丹麦
  EE: 'ee', // 爱沙尼亚
  ES: 'es', // 西班牙
  FI: 'fi', // 芬兰
  GR: 'gr', // 希腊
  HK: 'hk', // 香港
  HU: 'hu', // 匈牙利
  IE: 'ie', // 爱尔兰
  IN: 'in', // 印度
  JP: 'jp', // 日本
  KR: 'kr', // 韩国
  LT: 'lt', // 立陶宛
  LU: 'lu', // 卢森堡
  NL: 'nl', // 荷兰
  NO: 'no', // 挪威
  PL: 'pl', // 波兰
  PT: 'pt', // 葡萄牙
  RU: 'ru', // 俄罗斯
  SE: 'se', // 瑞典
  SI: 'si', // 斯洛文尼亚
  SK: 'sk', // 斯洛伐克
  TR: 'tr', // 土耳其
  UA: 'ua', // 乌克兰

  // CelesTrak 特殊格式
  UK: 'gb',
  CIS: 'ru',   // 俄罗斯/独联体
  PRC: 'cn',   // 中国
  CN: 'cn',
  TWN: 'tw',   // 台湾
  JPN: 'jp',   // 日本
  IND: 'in',   // 印度
  BRAZ: 'br',  // 巴西
  ARGN: 'ar',  // 阿根廷
  MEX: 'mx',   // 墨西哥
  SAUD: 'sa',  // 沙特阿拉伯
  INDO: 'id',  // 印度尼西亚
  TURK: 'tr',  // 土耳其
  NETH: 'nl',  // 荷兰
  THAI: 'th',  // 泰国
  SAFR: 'za',  // 南非
  UKR: 'ua',   // 乌克兰
  SING: 'sg',  // 新加坡
  POL: 'pl',   // 波兰
  SWED: 'se',  // 瑞典
  NOR: 'no',   // 挪威
  BEL: 'be',   // 比利时
  MALA: 'my',  // 马来西亚
  PAKI: 'pk',  // 巴基斯坦
  RP: 'ph',    // 菲律宾
  VENZ: 've',  // 委内瑞拉
  SWTZ: 'ch',  // 瑞士
  DEN: 'dk',   // 丹麦
  EGYP: 'eg',  // 埃及
  FIN: 'fi',   // 芬兰
  GREC: 'gr',  // 希腊
  IRAN: 'ir',  // 伊朗
  IRAQ: 'iq',  // 伊拉克
  KAZ: 'kz',   // 哈萨克斯坦
  KWT: 'kw',   // 科威特
  NIG: 'ng',   // 尼日利亚
  POR: 'pt',   // 葡萄牙
  SKOR: 'kr',  // 韩国
  UAE: 'ae',   // 阿联酋
  ISRA: 'il',  // 以色列
  SPN: 'es',   // 西班牙
  GER: 'de',   // 德国
  CZE: 'cz',   // 捷克
  EST: 'ee',   // 爱沙尼亚
  HUN: 'hu',   // 匈牙利
  LTU: 'lt',   // 立陶宛
  BGR: 'bg',   // 保加利亚
  ROM: 'ro',   // 罗马尼亚
  SVN: 'si',   // 斯洛文尼亚
  SVK: 'sk',   // 斯洛伐克
  HRV: 'hr',   // 克罗地亚
  AZER: 'az',  // 阿塞拜疆
  MDA: 'md',   // 摩尔多瓦
  MNG: 'mn',   // 蒙古
  NKOR: 'kp',  // 朝鲜
  LAOS: 'la',  // 老挝
  BGD: 'bd',   // 孟加拉国
  LKA: 'lk',   // 斯里兰卡
  MMR: 'mm',   // 缅甸
  NPL: 'np',   // 尼泊尔
  PER: 'pe',   // 秘鲁
  COL: 'co',   // 哥伦比亚
  CHLE: 'cl',  // 智利
  BOL: 'bo',   // 玻利维亚
  PRY: 'py',   // 巴拉圭
  URY: 'uy',   // 乌拉圭
  ECU: 'ec',   // 厄瓜多尔
  CRI: 'cr',   // 哥斯达黎加
  DJI: 'dj',   // 吉布提
  RWA: 'rw',   // 卢旺达
  UGA: 'ug',   // 乌干达
  GHA: 'gh',   // 加纳
  ZWE: 'zw',   // 津巴布韦
  BWA: 'bw',   // 博茨瓦纳
  MUS: 'mu',   // 毛里求斯
  AGO: 'ao',   // 安哥拉
  SDN: 'sd',   // 苏丹
  TUN: 'tn',   // 突尼斯
  ALG: 'dz',   // 阿尔及利亚
  QAT: 'qa',   // 卡塔尔
  BHR: 'bh',   // 巴林
  JOR: 'jo',   // 约旦
  PRI: 'pr',   // 波多黎各
  SLB: 'sb',   // 所罗门群岛
  MCO: 'mc',   // 摩纳哥
  KEN: 'ke',   // 肯尼亚
  VTNM: 'vn',  // 越南
  CHBZ: 'ch',  // 瑞士 (另一种写法)
  BELA: 'by',  // 白俄罗斯
  ASRA: 'at',  // 奥地利
  FGER: 'eu',  // 法国/德国 - 用欧盟旗帜
  FRIT: 'eu',  // 法国/意大利 - 用欧盟旗帜
  CZCH: 'cz',  // 捷克 (另一种写法)
  USBZ: 'us',  // 美国/巴西 - 用美国
  AUS: 'au',   // 澳大利亚
  SU: 'ru',    // 苏联

  // 国际组织 - 使用特殊旗帜或默认
  ESA: 'eu',   // 欧洲航天局
  ESRO: 'eu',  // 欧洲空间研究组织
  EUTE: 'int', // 欧洲通信卫星组织
  EUME: 'eu',  // 欧洲气象卫星组织
  NATO: 'nato', // 北约
  ITSO: 'int', // 国际通信卫星组织
  SES: 'lu',   // SES公司 (卢森堡)
  O3B: 'int',  // O3b网络
  ORB: 'us',   // 轨道科学公司 (美国)
  GLOB: 'us',  // 全球星 (美国)
  STCT: 'int', // 空间通信
  RASC: 'ru',  // 俄罗斯航天局
  SEAL: 'us',  // 海射公司 (美国注册)
  TBD: 'xx',   // 待定
  ABS: 'bm',   // ABS公司 (百慕大)

  // CelesTrak I-* 格式 (国际组织)
  'I-INT': 'int',   // 国际通信卫星组织
  'I-ESA': 'eu',    // 欧洲航天局
  'I-EU': 'eu',     // 欧盟
  'I-EUT': 'int',   // 欧洲通信卫星组织
  'I-EUM': 'eu',    // 欧洲气象卫星组织
  'I-ARAB': 'int',  // 阿拉伯卫星通信组织
  'I-INM': 'int',   // 国际移动卫星组织
  'I-NATO': 'nato', // 北约
  'I-RASC': 'ru',   // 俄罗斯航天局
}

/**
 * 组织/公司特殊图标类名
 */
export const ORGANIZATION_FLAGS: Record<string, string> = {
  ESA: 'fi fi-eu',
  ESRO: 'fi fi-eu',
  EUTE: 'organization-flags org-eutelsat',
  EUME: 'fi fi-eu',
  NATO: 'organization-flags org-nato',
  ITSO: 'organization-flags org-intelsat',
  SES: 'fi fi-lu',
  O3B: 'organization-flags org-o3b',
  ORB: 'fi fi-us',
  GLOB: 'fi fi-us',
  STCT: 'organization-flags org-intelsat',
  RASC: 'fi fi-ru',
  SEAL: 'fi fi-us',
  TBD: 'organization-flags org-tbd',
  ABS: 'fi fi-bm',
  // CelesTrak I-* 格式
  'I-INT': 'organization-flags org-intelsat',
  'I-ESA': 'fi fi-eu',
  'I-EU': 'organization-flags org-eu',
  'I-EUT': 'organization-flags org-eutelsat',
  'I-EUM': 'fi fi-eu',
  'I-ARAB': 'organization-flags org-arab',
  'I-INM': 'organization-flags org-inmarsat',
  'I-NATO': 'organization-flags org-nato',
  'I-RASC': 'fi fi-ru',
}

/**
 * 获取ISO国家代码
 */
export function getISOCode(celesTrakCode: string): string | undefined {
  return CELESTRAK_TO_ISO[celesTrakCode.toUpperCase()]
}

/**
 * 获取flag-icons的CSS类名
 */
export function getFlagClass(celesTrakCode: string): string {
  const code = celesTrakCode.toUpperCase()

  // 检查是否是组织
  if (ORGANIZATION_FLAGS[code]) {
    return ORGANIZATION_FLAGS[code]
  }

  const isoCode = CELESTRAK_TO_ISO[code]
  if (isoCode) {
    return `fi fi-${isoCode}`
  }

  // 未知国家使用默认旗帜
  return 'fi fi-xx'
}