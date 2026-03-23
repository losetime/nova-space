import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface DigestData {
  weatherAlerts?: any[];
  satellitePasses?: any[];
  intelligence?: any[];
  date: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    // 使用SMTP_USER作为发件人，因为很多邮件服务商要求发件人与认证用户相同
    this.fromEmail = this.configService.get<string>('app.email.user') || 'noreply@nova-space.com';
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('app.email.host');
    const port = this.configService.get<number>('app.email.port');
    const user = this.configService.get<string>('app.email.user');
    const pass = this.configService.get<string>('app.email.pass');

    if (!host || !user || !pass) {
      this.logger.warn('Email configuration not complete. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: (port || 587) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendDailyDigest(email: string, data: DigestData): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    const html = this.generateDigestHtml(data);
    const text = this.generateDigestText(data);

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: `Nova Space 每日太空资讯 - ${data.date}`,
        html,
        text,
      });
      this.logger.log(`Daily digest sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send daily digest to ${email}`, error);
      return false;
    }
  }

  async sendWeatherAlert(email: string, alert: any): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">⚠️ 空间天气预警</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3>${alert.title}</h3>
          <p><strong>类型:</strong> ${this.getAlertTypeText(alert.type)}</p>
          <p><strong>等级:</strong> ${alert.level || '未知'}</p>
          <p><strong>发布时间:</strong> ${alert.issueTime}</p>
          <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 4px;">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">${alert.message}</pre>
          </div>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          此邮件由 Nova Space 自动发送，请勿直接回复。
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: `【预警】${alert.title}`,
        html,
      });
      this.logger.log(`Weather alert sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send weather alert to ${email}`, error);
      return false;
    }
  }

  private generateDigestHtml(data: DigestData): string {
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; padding: 30px; border-radius: 12px;">
        <h1 style="color: #00d4ff; text-align: center; margin-bottom: 30px;">🚀 Nova Space 每日太空资讯</h1>
        <p style="color: #888; text-align: center; margin-bottom: 30px;">${data.date}</p>
    `;

    // 空间天气预警部分
    if (data.weatherAlerts && data.weatherAlerts.length > 0) {
      content += `
        <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #ff6b6b; margin-top: 0;">⚠️ 空间天气预警</h2>
      `;
      data.weatherAlerts.forEach((alert: any) => {
        content += `
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 10px 0;">${alert.title}</h4>
            <p style="color: #aaa; margin: 0; font-size: 14px;">类型: ${this.getAlertTypeText(alert.type)} | 等级: G${alert.level || '-'}</p>
          </div>
        `;
      });
      content += `</div>`;
    }

    // 卫星过境部分
    if (data.satellitePasses && data.satellitePasses.length > 0) {
      content += `
        <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; padding: 20px;">
          <h2 style="color: #00d4ff; margin-top: 0;">🛰️ 今日卫星过境</h2>
      `;
      data.satellitePasses.forEach((pass: any) => {
        content += `
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 10px 0;">${pass.name}</h4>
            <p style="color: #aaa; margin: 0; font-size: 14px;">
              过境时间: ${pass.time}<br>
              最大仰角: ${pass.maxElevation}°
            </p>
          </div>
        `;
      });
      content += `</div>`;
    }

    if (!data.weatherAlerts?.length && !data.satellitePasses?.length && !data.intelligence?.length) {
      content += `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="color: #888; font-size: 16px;">今日暂无重要太空资讯</p>
        </div>
      `;
    }

    // 航天情报部分
    if (data.intelligence && data.intelligence.length > 0) {
      content += `
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 20px; margin-top: 20px;">
          <h2 style="color: #a855f7; margin-top: 0;">📰 航天情报</h2>
      `;
      data.intelligence.forEach((item: any) => {
        content += `
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 8px 0;">${item.title}</h4>
            <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.5;">${item.summary || ''}</p>
          </div>
        `;
      });
      content += `</div>`;
    }

    content += `
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
          此邮件由 Nova Space 自动发送<br>
          <a href="${this.configService.get<string>('app.frontend.url')}" style="color: #00d4ff;">访问 Nova Space</a>
        </p>
      </div>
    `;

    return content;
  }

  private generateDigestText(data: DigestData): string {
    let content = `Nova Space 每日太空资讯 - ${data.date}\n\n`;

    if (data.weatherAlerts && data.weatherAlerts.length > 0) {
      content += `⚠️ 空间天气预警\n`;
      data.weatherAlerts.forEach((alert: any) => {
        content += `- ${alert.title} (类型: ${this.getAlertTypeText(alert.type)}, 等级: G${alert.level || '-'})\n`;
      });
      content += '\n';
    }

    if (data.satellitePasses && data.satellitePasses.length > 0) {
      content += `🛰️ 今日卫星过境\n`;
      data.satellitePasses.forEach((pass: any) => {
        content += `- ${pass.name}: ${pass.time}, 最大仰角: ${pass.maxElevation}°\n`;
      });
      content += '\n';
    }

    if (data.intelligence && data.intelligence.length > 0) {
      content += `📰 航天情报\n`;
      data.intelligence.forEach((item: any) => {
        content += `- ${item.title}\n  ${item.summary || ''}\n`;
      });
    }

    return content;
  }

  private getAlertTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      geomagnetic: '地磁暴',
      radiation: '辐射风暴',
      radio_blackout: '无线电中断',
      xray_flux: 'X射线通量',
    };
    return typeMap[type] || type;
  }
}