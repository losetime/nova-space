import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { ConfigService } from '@nestjs/config';
import { OrbitCalculatorService } from '../services/orbit-calculator.service';
import type { SatellitePosition } from '../interfaces/satellite.interface';

/**
 * 卫星 WebSocket 网关
 * 实时推送卫星位置数据
 */
@WebSocketGateway({
  path: '/ws/satellites',
  cors: {
    origin: '*',
  },
})
export class SatelliteGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SatelliteGateway.name);
  private clients: Set<WebSocket> = new Set();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private broadcastIntervalMs: number;

  constructor(
    private readonly orbitCalculator: OrbitCalculatorService,
    private readonly configService: ConfigService,
  ) {
    this.broadcastIntervalMs = this.configService.get<number>('app.satellite.broadcastInterval', 5000);
  }

  afterInit(server: Server) {
    this.logger.log('卫星 WebSocket 网关已初始化');
    this.startBroadcasting();
  }

  handleConnection(client: WebSocket) {
    this.logger.log(`客户端已连接，当前连接数: ${this.clients.size + 1}`);
    this.clients.add(client);

    // 立即发送当前卫星位置
    this.sendSatellitePositions(client);

    client.on('error', (error: Error) => {
      this.logger.error(`WebSocket 错误: ${error.message}`);
    });
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log(`客户端已断开，当前连接数: ${this.clients.size - 1}`);
    this.clients.delete(client);
  }

  /**
   * 发送卫星位置数据给单个客户端
   */
  private sendSatellitePositions(client: WebSocket) {
    try {
      const positions = this.orbitCalculator.calculateAllSatellitesPosition();
      const message = JSON.stringify({
        type: 'satellites',
        data: positions,
        timestamp: new Date().toISOString(),
      });
      client.send(message);
    } catch (error) {
      this.logger.error(`发送卫星数据错误: ${error.message}`);
    }
  }

  /**
   * 广播卫星位置数据给所有客户端
   */
  private broadcastSatellitePositions() {
    if (this.clients.size === 0) return;

    try {
      const positions = this.orbitCalculator.calculateAllSatellitesPosition();
      const message = JSON.stringify({
        type: 'satellites',
        data: positions,
        timestamp: new Date().toISOString(),
      });

      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      this.logger.error(`广播卫星数据错误: ${error.message}`);
    }
  }

  /**
   * 开始定时广播
   */
  private startBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    this.broadcastInterval = setInterval(() => {
      this.broadcastSatellitePositions();
    }, this.broadcastIntervalMs);

    this.logger.log(`卫星数据广播已启动，间隔: ${this.broadcastIntervalMs}ms`);
  }

  /**
   * 停止广播
   */
  stopBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * 获取当前连接数
   */
  getClientCount(): number {
    return this.clients.size;
  }
}