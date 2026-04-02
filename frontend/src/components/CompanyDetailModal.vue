<template>
  <a-modal
    v-model:open="visible"
    :title="null"
    :footer="null"
    :width="560"
    centered
    class="company-detail-modal"
    @cancel="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <div v-else-if="company" class="company-content">
      <!-- 公司头部 -->
      <div class="company-header">
        <div class="company-logo-wrapper">
          <img
            v-if="company.logoUrl"
            :src="company.logoUrl"
            :alt="company.name"
            class="company-logo"
          />
          <div v-else class="company-logo-placeholder">
            <BankOutlined />
          </div>
        </div>
        <div class="company-title">
          <h2>{{ company.name }}</h2>
          <div class="company-meta">
            <span class="meta-item">
              <GlobalOutlined />
              {{ company.country || '--' }}
            </span>
            <span class="meta-item">
              <CalendarOutlined />
              {{ company.foundedYear ? `成立于 ${company.foundedYear} 年` : '--' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 公司简介 -->
      <div class="company-description">
        <h4>
          <FileTextOutlined />
          公司简介
        </h4>
        <p>{{ company.description || '--' }}</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card operator">
          <RocketOutlined class="stat-icon" />
          <div class="stat-info">
            <span class="stat-value">{{ company.stats.operatorCount || 0 }}</span>
            <span class="stat-label">运营卫星</span>
          </div>
        </div>
        <div class="stat-card contractor">
          <ToolOutlined class="stat-icon" />
          <div class="stat-info">
            <span class="stat-value">{{ company.stats.contractorCount || 0 }}</span>
            <span class="stat-label">承包项目</span>
          </div>
        </div>
        <div class="stat-card manufacturer">
          <BuildOutlined class="stat-icon" />
          <div class="stat-info">
            <span class="stat-value">{{ company.stats.manufacturerCount || 0 }}</span>
            <span class="stat-label">制造卫星</span>
          </div>
        </div>
      </div>

      <!-- 关联卫星 -->
      <div class="satellite-section">
        <h4>
          <RocketOutlined />
          关联卫星
        </h4>

        <div class="satellite-group">
          <div class="group-label">
            <span class="label-dot operator"></span>
            运营 ({{ company.satellites.asOperator.length }})
          </div>
          <div class="satellite-tags">
            <template v-if="company.satellites.asOperator.length">
              <a-tag
                v-for="sat in company.satellites.asOperator.slice(0, 10)"
                :key="sat.noradId"
                class="sat-tag operator"
              >
                {{ sat.name }}
              </a-tag>
              <span
                v-if="company.satellites.asOperator.length > 10"
                class="more-count"
              >
                +{{ company.satellites.asOperator.length - 10 }}
              </span>
            </template>
            <span v-else class="no-data">--</span>
          </div>
        </div>

        <div class="satellite-group">
          <div class="group-label">
            <span class="label-dot contractor"></span>
            承包 ({{ company.satellites.asContractor.length }})
          </div>
          <div class="satellite-tags">
            <template v-if="company.satellites.asContractor.length">
              <a-tag
                v-for="sat in company.satellites.asContractor.slice(0, 10)"
                :key="sat.noradId"
                class="sat-tag contractor"
              >
                {{ sat.name }}
              </a-tag>
              <span
                v-if="company.satellites.asContractor.length > 10"
                class="more-count"
              >
                +{{ company.satellites.asContractor.length - 10 }}
              </span>
            </template>
            <span v-else class="no-data">--</span>
          </div>
        </div>

        <div class="satellite-group">
          <div class="group-label">
            <span class="label-dot manufacturer"></span>
            制造 ({{ company.satellites.asManufacturer.length }})
          </div>
          <div class="satellite-tags">
            <template v-if="company.satellites.asManufacturer.length">
              <a-tag
                v-for="sat in company.satellites.asManufacturer.slice(0, 10)"
                :key="sat.noradId"
                class="sat-tag manufacturer"
              >
                {{ sat.name }}
              </a-tag>
              <span
                v-if="company.satellites.asManufacturer.length > 10"
                class="more-count"
              >
                +{{ company.satellites.asManufacturer.length - 10 }}
              </span>
            </template>
            <span v-else class="no-data">--</span>
          </div>
        </div>
      </div>

      <!-- 官网链接 -->
      <div class="company-links">
        <h4>
          <LinkOutlined />
          官网
        </h4>
        <div class="link-content">
          <a
            v-if="company.website"
            :href="company.website"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ company.website }}
            <ExportOutlined class="export-icon" />
          </a>
          <span v-else class="no-data">--</span>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <a-result status="error" title="获取公司信息失败" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  BankOutlined,
  GlobalOutlined,
  CalendarOutlined,
  FileTextOutlined,
  RocketOutlined,
  ToolOutlined,
  BuildOutlined,
  LinkOutlined,
  ExportOutlined,
} from '@ant-design/icons-vue'
import { companyApi, type CompanyDetail } from '@/api'

interface Props {
  companyName: string
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const visible = ref(props.open)
const loading = ref(false)
const company = ref<CompanyDetail | null>(null)

watch(
  () => props.open,
  (val) => {
    visible.value = val
    if (val && props.companyName) {
      fetchCompanyDetail()
    }
  },
)

watch(visible, (val) => {
  emit('update:open', val)
})

const fetchCompanyDetail = async () => {
  loading.value = true
  company.value = null
  try {
    const res = await companyApi.getDetail(props.companyName)
    if (res.data.code === 0) {
      company.value = res.data.data
    } else {
      message.error('获取公司信息失败')
    }
  } catch (err) {
    console.error('获取公司详情失败:', err)
    message.error('获取公司信息失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.company-detail-modal {
  :deep(.ant-modal-content) {
    background: rgba(15, 15, 25, 0.98);
    border: 1px solid rgba(168, 85, 247, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  :deep(.ant-modal-body) {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.ant-modal-close) {
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      color: #fff;
    }
  }
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.company-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.company-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  .company-logo-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;

    .company-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .company-logo-placeholder {
      font-size: 28px;
      color: #a855f7;
    }
  }

  .company-title {
    flex: 1;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 8px 0;
    }

    .company-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

.company-description {
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 10px 0;
  }

  p {
    font-size: 13px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    padding: 14px;
    background: rgba(168, 85, 247, 0.06);
    border-radius: 10px;
    border: 1px solid rgba(168, 85, 247, 0.1);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: rgba(0, 212, 255, 0.04);
    border-radius: 10px;
    border: 1px solid rgba(0, 212, 255, 0.08);

    &.operator {
      background: rgba(0, 212, 255, 0.06);
      border-color: rgba(0, 212, 255, 0.15);

      .stat-icon {
        color: #00d4ff;
      }
    }

    &.contractor {
      background: rgba(123, 44, 191, 0.06);
      border-color: rgba(168, 85, 247, 0.15);

      .stat-icon {
        color: #a855f7;
      }
    }

    &.manufacturer {
      background: rgba(0, 255, 136, 0.06);
      border-color: rgba(0, 255, 136, 0.15);

      .stat-icon {
        color: #00ff88;
      }
    }

    .stat-icon {
      font-size: 20px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #fff;
      }

      .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

.satellite-section {
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 14px 0;
  }

  .satellite-group {
    margin-bottom: 12px;

    .group-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;

      .label-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.operator {
          background: #00d4ff;
        }

        &.contractor {
          background: #a855f7;
        }

        &.manufacturer {
          background: #00ff88;
        }
      }
    }

    .satellite-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .sat-tag {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 6px;

        &.operator {
          background: rgba(0, 212, 255, 0.1);
          border-color: rgba(0, 212, 255, 0.3);
          color: rgba(0, 212, 255, 0.9);
        }

        &.contractor {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.3);
          color: rgba(168, 85, 247, 0.9);
        }

        &.manufacturer {
          background: rgba(0, 255, 136, 0.1);
          border-color: rgba(0, 255, 136, 0.3);
          color: rgba(0, 255, 136, 0.9);
        }
      }

      .more-count {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        padding: 4px 10px;
      }

      .no-data {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        padding: 4px 10px;
      }
    }
  }
}

.company-links {
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 10px 0;
  }

  .link-content {
    a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #a855f7;
      padding: 10px 16px;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(168, 85, 247, 0.2);
      transition: all 0.2s ease;
      word-break: break-all;

      &:hover {
        background: rgba(168, 85, 247, 0.2);
        border-color: #a855f7;
        color: #c084fc;
      }

      .export-icon {
        font-size: 12px;
        opacity: 0.7;
      }
    }

    .no-data {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.4);
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: inline-block;
    }
  }
}
</style>