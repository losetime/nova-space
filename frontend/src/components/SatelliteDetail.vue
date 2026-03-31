<template>
  <div class="satellite-detail" v-if="satellite">
    <!-- 卫星头部 -->
    <div class="detail-header">
      <div class="sat-visual">
        <div class="orbit-container">
          <div class="orbit-path"></div>
          <div class="satellite-marker">
            <div class="marker-dot"></div>
            <div class="marker-glow"></div>
          </div>
        </div>
      </div>
      <div class="sat-title">
        <h3>{{ satellite.name }}</h3>
        <div class="sat-ids">
          <span class="norad-id">NORAD #{{ satellite.noradId }}</span>
          <span v-if="metadata?.objectId" class="object-id">{{ metadata.objectId }}</span>
        </div>
      </div>
      <!-- 关注按钮 -->
      <button
        class="follow-btn"
        :class="{ followed: isFavorited }"
        :disabled="followLoading"
        @click="handleToggleFavorite"
      >
        <template v-if="followLoading">
          <LoadingOutlined class="spin" />
        </template>
        <template v-else>
          <StarFilled v-if="isFavorited" />
          <StarOutlined v-else />
        </template>
      </button>
    </div>

    <!-- 基本信息 -->
    <div class="section" v-if="metadata">
      <div class="section-header" @click="expandedSections.basic = !expandedSections.basic">
        <div class="header-left">
          <InfoCircleOutlined class="section-icon" />
          <span>基本信息</span>
        </div>
        <DownOutlined :class="['expand-icon', { expanded: expandedSections.basic }]" />
      </div>
      <transition name="collapse">
        <div v-show="expandedSections.basic" class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">对象类型</span>
              <span
                v-if="metadata.objectType"
                :class="['info-value', 'type-badge', getObjectTypeClass(metadata.objectType)]"
              >
                {{ getObjectTypeLabel(metadata.objectType) }}
              </span>
              <span v-else class="info-value">--</span>
            </div>
            <div class="info-item">
              <span class="info-label">ESA分类</span>
              <span class="info-value">{{ metadata.objectClass || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属国家/组织</span>
              <span v-if="metadata.countryCode" class="info-value">
                <FlagIcon
                  :code="metadata.countryCode"
                  :country-name="getCountryName(metadata.countryCode)"
                  class="country-flag"
                />
                {{ getCountryName(metadata.countryCode) }}
              </span>
              <span v-else class="info-value">--</span>
            </div>
            <div class="info-item">
              <span class="info-label">发射日期</span>
              <span class="info-value">{{
                metadata.launchDate ? formatDate(metadata.launchDate) : "--"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">首次轨道历元</span>
              <span class="info-value">{{
                metadata.firstEpoch ? formatDate(metadata.firstEpoch) : "--"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">发射地点</span>
              <span class="info-value">{{
                metadata.launchSite ? getLaunchSiteName(metadata.launchSite) : "--"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运载工具</span>
              <span class="info-value">{{ metadata.launchVehicle || "--" }}</span>
            </div>
            <div class="info-item" v-if="metadata.flightNo">
              <span class="info-label">发射序号</span>
              <span class="info-value">{{ metadata.flightNo }}</span>
            </div>
            <div class="info-item" v-if="metadata.cosparLaunchNo">
              <span class="info-label">发射编号</span>
              <span class="info-value">{{ metadata.cosparLaunchNo }}</span>
            </div>
            <div class="info-item" v-if="metadata.launchSiteName">
              <span class="info-label">发射场</span>
              <span class="info-value">{{ metadata.launchSiteName }}</span>
            </div>
            <div class="info-item" v-if="metadata.launchFailure !== undefined">
              <span class="info-label">发射状态</span>
              <span
                :class="['info-value', 'status-badge', metadata.launchFailure ? 'decayed' : 'active']"
              >
                {{ metadata.launchFailure ? "发射失败" : "发射成功" }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">COSPAR编号</span>
              <span class="info-value">{{ metadata.cosparId || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">任务</span>
              <span class="info-value mission">{{ metadata.mission || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运营商</span>
              <span class="info-value">{{ metadata.operator || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用途</span>
              <span class="info-value">{{ metadata.purpose || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">发射质量</span>
              <span class="info-value"
                >{{ metadata.launchMass ? metadata.launchMass.toLocaleString() : "--" }} kg</span
              >
            </div>
            <div class="info-item">
              <span class="info-label">形状</span>
              <span class="info-value">{{ metadata.shape || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">尺寸/跨度</span>
              <span class="info-value">{{
                metadata.dimensions || (metadata.span ? `${metadata.span} m` : "--")
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">平台</span>
              <span class="info-value">{{ metadata.platform || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设计寿命</span>
              <span class="info-value">{{ metadata.lifetime || "--" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预测衰减日期</span>
              <span class="info-value">{{
                metadata.predDecayDate ? formatDate(metadata.predDecayDate) : "--"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">雷达截面</span>
              <span
                v-if="metadata.rcs"
                :class="['info-value', 'rcs-badge', getRcsClass(metadata.rcs)]"
                >{{ metadata.rcs }}</span
              >
              <span v-else class="info-value">--</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 轨道参数 -->
    <div class="section" v-if="satellite?.position">
      <div class="section-header" @click="expandedSections.orbit = !expandedSections.orbit">
        <div class="header-left">
          <CompassOutlined class="section-icon" />
          <span>轨道参数</span>
        </div>
        <DownOutlined :class="['expand-icon', { expanded: expandedSections.orbit }]" />
      </div>
      <transition name="collapse">
        <div v-show="expandedSections.orbit" class="section-content">
          <div class="param-grid">
            <div class="param-card">
              <div class="param-icon lng">
                <EnvironmentOutlined />
              </div>
              <div class="param-content">
                <label>经度</label>
                <span class="param-value">{{ formatNumber(satellite.position.lng, 4) }}°</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-icon lat">
                <EnvironmentOutlined />
              </div>
              <div class="param-content">
                <label>纬度</label>
                <span class="param-value">{{ formatNumber(satellite.position.lat, 4) }}°</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-icon alt">
                <RocketOutlined />
              </div>
              <div class="param-content">
                <label>轨道高度</label>
                <span class="param-value">{{ formatNumber(satellite.position.alt / 1000, 0) }} km</span>
              </div>
            </div>
            <div class="param-card">
              <div class="param-icon orbit">
                <GlobalOutlined />
              </div>
              <div class="param-content">
                <label>轨道类型</label>
                <span :class="['param-value', 'orbit-type', getOrbitClass(satellite.position.alt)]">
                  {{ getOrbitType(satellite.position.alt) }}
                </span>
              </div>
            </div>
          </div>
          <!-- 轨道特征（来自元数据） -->
          <div class="orbit-features" v-if="metadata">
            <div class="feature-item">
              <div class="feature-icon"><ThunderboltOutlined /></div>
              <div class="feature-content">
                <div class="feature-labels">
                  <span>近地点</span>
                  <span>远地点</span>
                </div>
                <div class="feature-values">
                  <span>{{ metadata.perigee ? `${metadata.perigee.toLocaleString()} km` : "--" }}</span>
                  <span>{{ metadata.apogee ? `${metadata.apogee.toLocaleString()} km` : "--" }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><ClockCircleOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">轨道周期</span>
                  <span class="feature-value">{{
                    metadata.period != null ? `${metadata.period.toFixed(1)} 分钟` : "--"
                  }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><AimOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">轨道倾角</span>
                  <span class="feature-value">{{
                    metadata.inclination != null ? `${metadata.inclination.toFixed(2)}°` : "--"
                  }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><RadiusSettingOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">偏心率</span>
                  <span class="feature-value">{{
                    metadata.eccentricity != null ? metadata.eccentricity.toFixed(6) : "--"
                  }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><CompassOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">升交点赤经</span>
                  <span class="feature-value">{{
                    metadata.raan != null ? `${metadata.raan.toFixed(2)}°` : "--"
                  }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><AimOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">近地点幅角</span>
                  <span class="feature-value">{{
                    metadata.argOfPerigee != null ? `${metadata.argOfPerigee.toFixed(2)}°` : "--"
                  }}</span>
                </div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><ClockCircleOutlined /></div>
              <div class="feature-content">
                <div class="feature-row">
                  <span class="feature-label">TLE数据年龄</span>
                  <span
                    :class="[
                      'feature-value',
                      {
                        warning: metadata.tleAge != null && metadata.tleAge > 7,
                        old: metadata.tleAge != null && metadata.tleAge > 14,
                      },
                    ]"
                  >
                    {{ metadata.tleAge !== undefined ? `${metadata.tleAge} 天` : "--" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 状态信息 -->
    <div class="section">
      <div class="section-header" @click="expandedSections.status = !expandedSections.status">
        <div class="header-left">
          <DashboardOutlined class="section-icon" />
          <span>运行状态</span>
        </div>
        <DownOutlined :class="['expand-icon', { expanded: expandedSections.status }]" />
      </div>
      <transition name="collapse">
        <div v-show="expandedSections.status" class="section-content">
          <div class="status-panel">
            <div
              class="status-indicator"
              :class="{ active: !metadata?.decayDate, decayed: !!metadata?.decayDate }"
            >
              <span class="indicator-dot"></span>
              <span class="indicator-text">{{ metadata?.decayDate ? "已衰减" : "运行中" }}</span>
            </div>
            <div class="status-time-row">
              <span class="status-label">数据更新时间</span>
              <span class="status-time">{{ formatTime(satellite.timestamp) }}</span>
            </div>
            <div class="decay-warning" v-if="metadata?.decayDate">
              <WarningOutlined />
              <span>该卫星已于 {{ formatDate(metadata.decayDate) }} 坠落大气层</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>

  <!-- 空状态 -->
  <div class="empty-state" v-else>
    <div class="empty-visual">
      <div class="empty-orbit">
        <div class="empty-dot"></div>
      </div>
      <GlobalOutlined class="empty-globe" />
    </div>
    <p>请选择一颗卫星</p>
    <span>从左侧列表中选择卫星查看详细信息</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import {
  GlobalOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  AimOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  StarOutlined,
  StarFilled,
  LoadingOutlined,
  RadiusSettingOutlined,
  DownOutlined,
} from "@ant-design/icons-vue";
import type { Satellite } from "@/hooks/useWebSocket";
import FlagIcon from "@/components/FlagIcon.vue";
import { satelliteApi } from "@/api";
import { useUserStore } from "@/stores/user";

// 元数据接口
interface SatelliteMetadata {
  noradId: string;
  name?: string;
  objectId?: string;
  altNames?: string[];
  objectType?: string;
  status?: string;
  countryCode?: string;
  launchDate?: string;
  launchSite?: string;
  launchVehicle?: string;
  decayDate?: string;
  period?: number;
  inclination?: number;
  apogee?: number;
  perigee?: number;
  eccentricity?: number;
  raan?: number;
  argOfPerigee?: number;
  rcs?: string;
  stdMag?: number;
  tleEpoch?: string;
  tleAge?: number;
  // DISCOS 扩展字段
  cosparId?: string; // COSPAR 编号
  objectClass?: string; // ESA 对象分类
  mission?: string; // 任务描述
  operator?: string; // 运营商
  purpose?: string; // 用途
  contractor?: string; // 制造商
  launchMass?: number; // 发射质量 (kg)
  shape?: string; // 形状
  dimensions?: string; // 尺寸
  span?: number; // 最大跨度 (米)
  lifetime?: string; // 设计寿命
  platform?: string; // 卫星平台
  firstEpoch?: string; // 首次轨道历元
  predDecayDate?: string; // 预测衰减日期
  // 发射扩展信息
  flightNo?: string; // 发射序号
  cosparLaunchNo?: string; // COSPAR 发射编号
  launchFailure?: boolean; // 发射是否失败
  launchSiteName?: string; // 发射场名称
}

interface Props {
  satellite: Satellite | null;
  metadata: SatelliteMetadata | null;
}

const props = defineProps<Props>();

// 折叠状态
const expandedSections = ref({
  basic: true,
  orbit: true,
  status: true,
});

watch(
  () => props.metadata,
  () => {
    console.log("metadata-", props.metadata);
  },
  {
    deep: true,
    immediate: true,
  },
);

const emit = defineEmits<{
  (e: "favorite-change", noradId: string, favorited: boolean): void;
}>();

const userStore = useUserStore();
const isFavorited = ref(false);
const followLoading = ref(false);

// 检查是否已关注
async function checkFavorite() {
  if (!props.satellite || !userStore.isLoggedIn) return;
  try {
    const res = await satelliteApi.checkFavorite(props.satellite.noradId);
    isFavorited.value = res.data.data.favorited;
  } catch {
    // 忽略错误
  }
}

// 切换关注状态
async function handleToggleFavorite() {
  if (!userStore.isLoggedIn) {
    message.warning("请先登录");
    return;
  }
  if (!props.satellite) return;

  followLoading.value = true;
  try {
    const res = await satelliteApi.toggleFavorite(props.satellite.noradId);
    isFavorited.value = res.data.data.favorited;
    message.success(res.data.message);
    // 通知父组件收藏状态变化
    emit("favorite-change", props.satellite.noradId, isFavorited.value);
  } catch {
    message.error("操作失败");
  } finally {
    followLoading.value = false;
  }
}

// 监听卫星变化
watch(
  () => props.satellite,
  () => {
    checkFavorite();
  },
  { immediate: true },
);

// 国家代码到中文名称的映射 (CelesTrak 格式)
const COUNTRY_NAMES: Record<string, string> = {
  // 标准代码
  US: "美国",
  UK: "英国",
  FR: "法国",
  CA: "加拿大",
  IT: "意大利",
  NZ: "新西兰",
  MA: "摩洛哥",
  IM: "马恩岛",
  AC: "阿森松岛",
  AB: "安提瓜和巴布达",
  // CelesTrak 特殊格式
  CIS: "俄罗斯",
  PRC: "中国",
  CN: "中国",
  TWN: "中国台湾",
  JPN: "日本",
  IND: "印度",
  BRAZ: "巴西",
  ARGN: "阿根廷",
  MEX: "墨西哥",
  SAUD: "沙特阿拉伯",
  INDO: "印度尼西亚",
  TURK: "土耳其",
  NETH: "荷兰",
  THAI: "泰国",
  SAFR: "南非",
  UKR: "乌克兰",
  SING: "新加坡",
  POL: "波兰",
  SWED: "瑞典",
  NOR: "挪威",
  BEL: "比利时",
  MALA: "马来西亚",
  PAKI: "巴基斯坦",
  RP: "菲律宾",
  VENZ: "委内瑞拉",
  SWTZ: "瑞士",
  DEN: "丹麦",
  EGYP: "埃及",
  FIN: "芬兰",
  GREC: "希腊",
  IRAN: "伊朗",
  IRAQ: "伊拉克",
  KAZ: "哈萨克斯坦",
  KWT: "科威特",
  NIG: "尼日利亚",
  POR: "葡萄牙",
  SKOR: "韩国",
  UAE: "阿联酋",
  ISRA: "以色列",
  SPN: "西班牙",
  GER: "德国",
  CZE: "捷克",
  EST: "爱沙尼亚",
  HUN: "匈牙利",
  LTU: "立陶宛",
  BGR: "保加利亚",
  ROM: "罗马尼亚",
  SVN: "斯洛文尼亚",
  SVK: "斯洛伐克",
  HRV: "克罗地亚",
  AZER: "阿塞拜疆",
  MDA: "摩尔多瓦",
  MNG: "蒙古",
  NKOR: "朝鲜",
  LAOS: "老挝",
  BGD: "孟加拉国",
  LKA: "斯里兰卡",
  MMR: "缅甸",
  NPL: "尼泊尔",
  PER: "秘鲁",
  COL: "哥伦比亚",
  CHLE: "智利",
  BOL: "玻利维亚",
  PRY: "巴拉圭",
  URY: "乌拉圭",
  ECU: "厄瓜多尔",
  CRI: "哥斯达黎加",
  DJI: "吉布提",
  RWA: "卢旺达",
  UGA: "乌干达",
  GHA: "加纳",
  ZWE: "津巴布韦",
  BWA: "博茨瓦纳",
  MUS: "毛里求斯",
  AGO: "安哥拉",
  SDN: "苏丹",
  TUN: "突尼斯",
  ALG: "阿尔及利亚",
  QAT: "卡塔尔",
  BHR: "巴林",
  JOR: "约旦",
  PRI: "波多黎各",
  SLB: "所罗门群岛",
  MCO: "摩纳哥",
  KEN: "肯尼亚",
  VTNM: "越南",
  CHBZ: "瑞士",
  BELA: "白俄罗斯",
  ASRA: "奥地利",
  FGER: "法国/德国",
  FRIT: "法国/意大利",
  CZCH: "捷克",
  USBZ: "美国/巴西",
  // 组织
  ESA: "欧洲航天局",
  ESRO: "欧洲空间研究组织",
  EUTE: "欧洲通信卫星组织",
  EUME: "欧洲气象卫星组织",
  NATO: "北约",
  ITSO: "国际通信卫星组织",
  SES: "SES公司",
  O3B: "O3b网络",
  ORB: "轨道科学公司",
  GLOB: "全球星",
  STCT: "空间通信",
  RASC: "俄罗斯航天局",
  SEAL: "海射公司",
  TBD: "待定",
  ABS: "ABS公司",
};

// 发射场映射
const LAUNCH_SITES: Record<string, string> = {
  AFETR: "卡纳维拉尔角空军基地",
  AFWTR: "范登堡空军基地",
  KSC: "肯尼迪航天中心",
  TTFFB: "太原卫星发射中心",
  JSC: "酒泉卫星发射中心",
  XSC: "西昌卫星发射中心",
  WSC: "文昌航天发射场",
  TTMTR: "拜科努尔航天发射场",
  PLMSC: "普列谢茨克航天发射场",
  SNMLP: "圣马科发射平台",
  SEM: "种岛航天中心",
  TNG: "种子岛航天中心",
  KSCUT: "内之浦宇宙空间观测所",
  YAVNE: "亚夫内发射场",
  FRGUI: "圭亚那航天中心",
  NSW: "新南威尔士发射场",
};

// 对象类型映射
const OBJECT_TYPES: Record<string, { label: string; class: string }> = {
  PAYLOAD: { label: "有效载荷", class: "payload" },
  "ROCKET BODY": { label: "火箭体", class: "rocket" },
  DEBRIS: { label: "碎片", class: "debris" },
};

// 状态映射
const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  "+": { label: "在轨运行", class: "active" },
  D: { label: "已衰减", class: "decayed" },
  P: { label: "部分衰减", class: "partial" },
  "N/A": { label: "不适用", class: "na" },
};

// RCS 映射
const RCS_CLASSES: Record<string, string> = {
  LARGE: "large",
  MEDIUM: "medium",
  SMALL: "small",
};

// 格式化函数
const formatNumber = (num: number | undefined | null, decimals: number): string => {
  if (num == null) return "--";
  return num.toFixed(decimals);
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getOrbitType = (alt: number): string => {
  if (alt < 2000000) return "低轨 LEO";
  if (alt < 35000000) return "中轨 MEO";
  return "地球同步 GEO";
};

const getOrbitClass = (alt: number): string => {
  if (alt < 2000000) return "leo";
  if (alt < 35000000) return "meo";
  return "geo";
};

const getCountryName = (code: string): string => {
  return COUNTRY_NAMES[code] || code;
};

const getLaunchSiteName = (code: string): string => {
  return LAUNCH_SITES[code] || code;
};

const getObjectTypeLabel = (type: string): string => {
  return OBJECT_TYPES[type]?.label || type;
};

const getObjectTypeClass = (type: string): string => {
  return OBJECT_TYPES[type]?.class || "";
};

const getRcsClass = (rcs: string): string => {
  return RCS_CLASSES[rcs] || "";
};
</script>

<style scoped lang="scss">
.satellite-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.15);
    border-radius: 2px;
  }
}

// 头部
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
  margin-bottom: 20px;
}

.sat-visual {
  width: 64px;
  height: 64px;
  flex-shrink: 0;

  .orbit-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .orbit-path {
      width: 50px;
      height: 50px;
      border: 2px solid rgba(0, 212, 255, 0.2);
      border-radius: 50%;
      animation: orbit-spin 10s linear infinite;
    }

    .satellite-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: orbit-motion 4s linear infinite;

      .marker-dot {
        width: 10px;
        height: 10px;
        background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%);
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
      }

      .marker-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
      }
    }
  }
}

@keyframes orbit-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbit-motion {
  0% {
    transform: translate(calc(-50% + 25px), -50%);
  }
  25% {
    transform: translate(-50%, calc(-50% + 25px));
  }
  50% {
    transform: translate(calc(-50% - 25px), -50%);
  }
  75% {
    transform: translate(-50%, calc(-50% - 25px));
  }
  100% {
    transform: translate(calc(-50% + 25px), -50%);
  }
}

.sat-title {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sat-ids {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .norad-id,
  .object-id {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    background: rgba(0, 212, 255, 0.08);
    padding: 3px 8px;
    border-radius: 6px;
  }

  .object-id {
    background: rgba(123, 44, 191, 0.15);
    color: rgba(255, 255, 255, 0.6);
  }
}

// 区块
.section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.15);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }

  .section-icon {
    font-size: 14px;
    color: #00d4ff;
  }

  .expand-icon {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    transition: transform 0.2s ease;

    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.section-content {
  padding-top: 12px;
}

// 基本信息网格
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 10px;

  .info-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .info-value {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: right;
    margin-left: 12px;

    &.decay {
      color: #ff6b6b;
    }

    &.mission {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .country-flag {
    width: 20px;
    height: 15px;
    margin-right: 6px;
    display: inline-block;
    vertical-align: middle;
  }
}

// 类型标签
.type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.payload {
    background: rgba(0, 255, 136, 0.15);
    color: #00ff88;
  }

  &.rocket {
    background: rgba(255, 170, 0, 0.15);
    color: #ffaa00;
  }

  &.debris {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }
}

// 状态标签
.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.active {
    background: rgba(0, 255, 136, 0.15);
    color: #00ff88;
  }

  &.decayed {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }

  &.partial {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
  }

  &.na {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
  }
}

// RCS 标签
.rcs-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.large {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }

  &.medium {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
  }

  &.small {
    background: rgba(0, 212, 255, 0.15);
    color: #00d4ff;
  }
}

// 别名样式
.alt-names {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 参数网格
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.param-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.15);
  }

  .param-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 14px;

    &.lng {
      background: rgba(0, 212, 255, 0.12);
      color: #00d4ff;
    }
    &.lat {
      background: rgba(0, 255, 136, 0.12);
      color: #00ff88;
    }
    &.alt {
      background: rgba(123, 44, 191, 0.12);
      color: #b366e8;
    }
    &.orbit {
      background: rgba(255, 170, 0, 0.12);
      color: #ffaa00;
    }
  }

  .param-content {
    flex: 1;
    min-width: 0;

    label {
      display: block;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .param-value {
      font-size: 13px;
      font-weight: 600;
      color: #fff;

      &.orbit-type {
        &.leo {
          color: #00ff88;
        }
        &.meo {
          color: #00d4ff;
        }
        &.geo {
          color: #b366e8;
        }
      }
    }
  }
}

// 轨道特征
.orbit-features {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 12px;

  .feature-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(0, 212, 255, 0.12);
    color: #00d4ff;
    font-size: 14px;
  }

  .feature-content {
    flex: 1;
  }

  .feature-labels,
  .feature-values {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .feature-labels {
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 4px;
  }

  .feature-values {
    color: #fff;
    font-weight: 500;
  }

  .feature-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .feature-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .feature-value {
    font-size: 13px;
    font-weight: 500;
    color: #fff;

    &.warning {
      color: #ffc107;
    }

    &.old {
      color: #ff6b6b;
    }
  }
}

// 状态面板
.status-panel {
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4d4d;
  }

  &.active .indicator-dot {
    background: #00ff88;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  &.decayed .indicator-dot {
    background: #ff6b6b;
  }

  .indicator-text {
    font-size: 13px;
    font-weight: 500;
    color: #ff6b6b;
  }

  &.active .indicator-text {
    color: #00ff88;
  }
}

.status-time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .status-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .status-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.decay-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 12px;
}

// 空状态
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
}

.empty-visual {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 24px;

  .empty-orbit {
    width: 80px;
    height: 80px;
    border: 2px dashed rgba(0, 212, 255, 0.2);
    border-radius: 50%;
    animation: slow-spin 15s linear infinite;

    .empty-dot {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background: rgba(0, 212, 255, 0.3);
      border-radius: 50%;
    }
  }

  .empty-globe {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28px;
    color: rgba(0, 212, 255, 0.25);
  }
}

@keyframes slow-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.empty-state span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

// 关注按钮
.follow-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  background: rgba(0, 212, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
  }

  &.followed {
    background: rgba(255, 193, 7, 0.15);
    border-color: rgba(255, 193, 7, 0.3);
    color: #ffc107;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 折叠动画
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
