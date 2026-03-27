import { NestFactory } from '@nestjs/core';
import { MilestoneService } from '../src/modules/milestone/milestone.service';
import { MilestoneCategory } from '../src/modules/milestone/entities/milestone.entity';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const milestoneService = app.get(MilestoneService);

  const milestones = [
    // 1950s - 航天开端
    {
      title: '斯普特尼克 1 号发射',
      description: '人类历史上第一颗人造卫星发射成功，开启航天时代',
      eventDate: '1957-10-04',
      category: MilestoneCategory.LAUNCH,
      importance: 5,
      location: '拜科努尔航天发射场',
      organizer: '苏联',
    },
    {
      title: '美国成立 NASA',
      description: '美国国家航空航天局（NASA）正式成立',
      eventDate: '1958-10-01',
      category: MilestoneCategory.OTHER,
      importance: 4,
      location: '华盛顿特区',
      organizer: '美国',
    },

    // 1960s - 载人航天与登月
    {
      title: '加加林进入太空',
      description: '尤里·加加林乘坐东方 1 号成为首个进入太空的人类',
      eventDate: '1961-04-12',
      category: MilestoneCategory.LAUNCH,
      importance: 5,
      location: '拜科努尔航天发射场',
      organizer: '苏联',
    },
    {
      title: '阿波罗 11 号登月',
      description: '尼尔·阿姆斯特朗成为首个踏上月球的人类',
      eventDate: '1969-07-20',
      category: MilestoneCategory.MISSION,
      importance: 5,
      location: '月球',
      organizer: '美国',
    },

    // 1970s - 中国航天起步
    {
      title: '东方红一号发射',
      description: '中国第一颗人造地球卫星发射成功，使中国成为第五个独立发射卫星的国家',
      eventDate: '1970-04-24',
      category: MilestoneCategory.LAUNCH,
      importance: 5,
      location: '酒泉卫星发射中心',
      organizer: '中国',
    },
    {
      title: '阿波罗 - 联盟测试计划',
      description: '美苏首次载人航天国际合作任务',
      eventDate: '1975-07-15',
      category: MilestoneCategory.MISSION,
      importance: 4,
      organizer: '美国/苏联',
    },

    // 1980s - 航天飞机时代
    {
      title: '哥伦比亚号首飞',
      description: '美国第一架航天飞机哥伦比亚号成功首飞',
      eventDate: '1981-04-12',
      category: MilestoneCategory.LAUNCH,
      importance: 4,
      location: '肯尼迪航天中心',
      organizer: '美国',
    },
    {
      title: '挑战者号事故',
      description: '挑战者号航天飞机发射时爆炸，7 名宇航员遇难',
      eventDate: '1986-01-28',
      category: MilestoneCategory.OTHER,
      importance: 4,
      location: '卡纳维拉尔角',
      organizer: '美国',
    },

    // 1990s - 空间站与国际合作
    {
      title: '和平号空间站核心舱发射',
      description: '苏联和平号空间站核心舱升空，开启长期载人航天新时代',
      eventDate: '1986-02-19',
      category: MilestoneCategory.ORBIT,
      importance: 4,
      organizer: '苏联',
    },
    {
      title: '国际空间站首个组件发射',
      description: '国际空间站（ISS）建设正式启动',
      eventDate: '1998-11-20',
      category: MilestoneCategory.ORBIT,
      importance: 5,
      organizer: '多国合作',
    },

    // 2000s - 中国载人航天
    {
      title: '神舟五号载人飞行',
      description: '杨利伟成为中国首位进入太空的航天员',
      eventDate: '2003-10-15',
      category: MilestoneCategory.LAUNCH,
      importance: 5,
      location: '酒泉卫星发射中心',
      organizer: '中国',
    },
    {
      title: '神舟七号太空行走',
      description: '翟志刚完成中国首次太空行走',
      eventDate: '2008-09-27',
      category: MilestoneCategory.ORBIT,
      importance: 4,
      organizer: '中国',
    },

    // 2010s - 商业航天崛起
    {
      title: 'SpaceX 龙飞船对接 ISS',
      description: 'SpaceX 成为首家向国际空间站运送货物的私营公司',
      eventDate: '2012-05-25',
      category: MilestoneCategory.MISSION,
      importance: 4,
      organizer: 'SpaceX',
    },
    {
      title: '嫦娥三号月面软着陆',
      description: '中国嫦娥三号携玉兔号月球车成功着陆月球',
      eventDate: '2013-12-14',
      category: MilestoneCategory.MISSION,
      importance: 5,
      location: '月球虹湾',
      organizer: '中国',
    },
    {
      title: '猎鹰重型首飞成功',
      description: 'SpaceX 猎鹰重型火箭首飞成功，将一辆特斯拉跑车送入太空',
      eventDate: '2018-02-06',
      category: MilestoneCategory.LAUNCH,
      importance: 4,
      location: '肯尼迪航天中心',
      organizer: 'SpaceX',
    },

    // 2020s - 深空探测新纪元
    {
      title: '天问一号火星探测',
      description: '中国首个火星探测器成功发射，一次性完成绕落巡',
      eventDate: '2020-07-23',
      category: MilestoneCategory.MISSION,
      importance: 5,
      organizer: '中国',
    },
    {
      title: '中国空间站天和核心舱发射',
      description: '中国空间站建设正式启动',
      eventDate: '2021-04-29',
      category: MilestoneCategory.ORBIT,
      importance: 5,
      location: '文昌航天发射场',
      organizer: '中国',
    },
    {
      title: '詹姆斯·韦伯望远镜发射',
      description: '人类最强大的太空望远镜发射升空',
      eventDate: '2021-12-25',
      category: MilestoneCategory.LAUNCH,
      importance: 5,
      organizer: 'NASA/ESA/CSA',
    },
    {
      title: '嫦娥五号采样返回',
      description: '中国首次实现地外天体采样返回',
      eventDate: '2020-12-17',
      category: MilestoneCategory.RECOVERY,
      importance: 5,
      organizer: '中国',
    },
  ];

  console.log('开始导入航天里程碑数据...');

  let count = 0;
  for (const data of milestones) {
    try {
      await milestoneService.create({
        ...data,
        isPublished: true,
      });
      count++;
      console.log(`✓ 已创建：${data.title}`);
    } catch (error) {
      console.error(`✗ 创建失败：${data.title}`, error.message);
    }
  }

  console.log(`\n完成！共创建 ${count}/${milestones.length} 条里程碑记录`);

  await app.close();
}

bootstrap().catch(console.error);
