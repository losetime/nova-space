import * as Cesium from "cesium";

export class GlobeAutoRotate {
  private viewer: Cesium.Viewer;
  private speed: number;
  private enable: boolean;
  private isPaused: boolean = false;
  private _removeListener: (() => void) | null = null;
  private _removeMouseDown: (() => void) | null = null;
  private _removeMouseUp: (() => void) | null = null;
  private _userRotateHandler: Cesium.ScreenSpaceEventHandler | null = null;

  constructor(viewer: Cesium.Viewer, options: { speed?: number; enable?: boolean } = {}) {
    this.viewer = viewer;
    this.speed = options.speed ?? 0.001;
    this.enable = options.enable ?? true;
  }

  start() {
    this.enable = true;
    this._removeListener = this.viewer.scene.postRender.addEventListener(() => {
      if (this.enable && !this.isPaused) {
        this.viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, this.speed);
      }
    });

    this._userRotateHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this._removeMouseDown = this._userRotateHandler.setInputAction(() => {
      this.isPaused = true;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    this._removeMouseUp = this._userRotateHandler.setInputAction(() => {
      // 鼠标松开后不恢复旋转
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  stop() {
    this.enable = false;
    this.isPaused = false;
    if (this._removeListener) {
      this._removeListener();
      this._removeListener = null;
    }
    if (this._removeMouseDown) {
      this._removeMouseDown();
      this._removeMouseDown = null;
    }
    if (this._removeMouseUp) {
      this._removeMouseUp();
      this._removeMouseUp = null;
    }
    if (this._userRotateHandler) {
      this._userRotateHandler.destroy();
      this._userRotateHandler = null;
    }
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  isRunning(): boolean {
    return this.enable && this._removeListener !== null;
  }
}