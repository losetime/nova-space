<template>
  <div class="about">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <span class="badge">关于我们</span>
        <h1 class="title">探索无限可能</h1>
        <p class="subtitle">
          我们致力于打造卓越的数字体验，用创新技术连接世界，让每一次交互都充满价值。
        </p>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission">
      <div class="container">
        <div class="mission-card">
          <div class="mission-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2>我们的使命</h2>
          <p>
            通过技术创新和卓越设计，为用户提供简单、高效、安全的解决方案。
            我们相信技术的力量可以改变世界，让复杂的事情变得简单。
          </p>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="values">
      <div class="container">
        <h2 class="section-title">核心价值观</h2>
        <div class="values-grid">
          <div class="value-card" v-for="value in values" :key="value.title">
            <div class="value-icon" v-html="value.icon"></div>
            <h3>{{ value.title }}</h3>
            <p>{{ value.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item" v-for="stat in stats" :key="stat.label">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team">
      <div class="container">
        <h2 class="section-title">核心团队</h2>
        <div class="team-grid">
          <div class="team-card" v-for="member in team" :key="member.name">
            <div class="avatar">{{ member.initials }}</div>
            <h3>{{ member.name }}</h3>
            <span class="role">{{ member.role }}</span>
            <p>{{ member.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <h2>准备好开始了吗？</h2>
        <p>加入我们，一起创造未来</p>
        <button class="cta-button">联系我们</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const values = ref([
  {
    title: '创新',
    description: '不断探索新技术，勇于突破边界，为用户带来前所未有的体验。',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
  },
  {
    title: '品质',
    description: '对每一个细节精益求精，确保产品稳定可靠，经得起时间考验。',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
  },
  {
    title: '协作',
    description: '相信团队的力量，通过开放沟通和紧密合作实现共同目标。',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
  },
  {
    title: '用户至上',
    description: '始终以用户需求为中心，倾听反馈，持续优化产品体验。',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
  }
])

const stats = ref([
  { value: '10K+', label: '活跃用户' },
  { value: '99.9%', label: '服务可用性' },
  { value: '50+', label: '合作伙伴' },
  { value: '24/7', label: '技术支持' }
])

const team = ref([
  {
    name: '张明',
    initials: '张',
    role: '创始人 & CEO',
    bio: '拥有15年技术管理经验，致力于推动数字化转型。'
  },
  {
    name: '李华',
    initials: '李',
    role: '技术总监',
    bio: '全栈工程师，专注于系统架构和性能优化。'
  },
  {
    name: '王芳',
    initials: '王',
    role: '设计总监',
    bio: '资深UI/UX设计师，追求极致的用户体验。'
  }
])
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap');

/* Base styles */
.about {
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero Section */
.hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
  background: linear-gradient(180deg, #09090b 0%, #000000 100%);
}

.hero-content {
  max-width: 800px;
}

.badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(239, 35, 60, 0.1);
  border: 1px solid rgba(239, 35, 60, 0.3);
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  color: #ef233c;
  margin-bottom: 24px;
}

.title {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 24px 0;
  background: linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 18px;
  line-height: 1.7;
  color: #a1a1aa;
  margin: 0;
}

/* Mission Section */
.mission {
  padding: 80px 24px;
  background: #09090b;
}

.mission-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center;
}

.mission-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 35, 60, 0.1);
  border: 1px solid rgba(239, 35, 60, 0.2);
  border-radius: 16px;
  color: #ef233c;
}

.mission-card h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #ffffff;
}

.mission-card p {
  font-size: 16px;
  line-height: 1.7;
  color: #a1a1aa;
  margin: 0;
}

/* Values Section */
.values {
  padding: 80px 24px;
  background: #000000;
}

.section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 48px 0;
  color: #ffffff;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.value-card {
  padding: 32px;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.value-card:hover {
  border-color: rgba(239, 35, 60, 0.3);
  transform: translateY(-4px);
}

.value-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 35, 60, 0.1);
  border-radius: 12px;
  color: #ef233c;
  margin-bottom: 20px;
}

.value-card h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #ffffff;
}

.value-card p {
  font-size: 14px;
  line-height: 1.6;
  color: #a1a1aa;
  margin: 0;
}

/* Stats Section */
.stats {
  padding: 80px 24px;
  background: #09090b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  text-align: center;
}

.stat-item {
  padding: 32px;
}

.stat-value {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 48px;
  font-weight: 800;
  color: #ef233c;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #a1a1aa;
}

/* Team Section */
.team {
  padding: 80px 24px;
  background: #000000;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.team-card {
  padding: 32px;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.team-card:hover {
  border-color: rgba(239, 35, 60, 0.3);
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ef233c 0%, #d90429 100%);
  border-radius: 50%;
  font-family: 'Manrope', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
}

.team-card h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffffff;
}

.role {
  display: block;
  font-size: 14px;
  color: #ef233c;
  margin-bottom: 12px;
}

.team-card p {
  font-size: 14px;
  line-height: 1.6;
  color: #a1a1aa;
  margin: 0;
}

/* CTA Section */
.cta {
  padding: 100px 24px;
  background: linear-gradient(180deg, #09090b 0%, #18181b 100%);
  text-align: center;
}

.cta h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #ffffff;
}

.cta p {
  font-size: 18px;
  color: #a1a1aa;
  margin: 0 0 32px 0;
}

.cta-button {
  padding: 16px 40px;
  background: #ef233c;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button:hover {
  background: #d90429;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 35, 60, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 60px 16px;
    min-height: 50vh;
  }

  .mission-card {
    padding: 32px 24px;
  }

  .values,
  .team,
  .stats {
    padding: 60px 16px;
  }

  .cta {
    padding: 60px 16px;
  }

  .cta h2 {
    font-size: 28px;
  }
}
</style>