import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

class Point {
  constructor(x, y, walkable = true) {
    this.x = x;
    this.y = y;
    this.walkable = !!walkable;
    this.active = false;
    this.F = 0;
    this.G = 0;
    this.H = 0;
  }
  is(otherPoint) {
    return this.x === otherPoint.x && this.y === otherPoint.y;
  }
  setWalkable(walkable) {
    this.walkable = !!walkable;
    return this;
  }
}

class Matrix {
  constructor(x, y) {
    const array = [];
    for (let i = 0; i < x; i++) {
      array[i] = array[i] || [];
      for (let m = 0; m < y; m++) {
        array[i][m] = new Point(i + 1, m + 1);
      }
    }
    this.array = array;
    this.openList = [];
    this.closeList = [];
  }
  getPoint(x, y) {
    let distPoint = null;
    if (y > this.array.length) return null;
    this.array.forEach(row => {
      row.forEach(point => {
        if (point.x === x && point.y === y) {
          distPoint = point;
        }
      });
    });
    return distPoint;
  }
  // 查找临近的坐标点, 最多有8个点
  findNeighbor(point) {
    const { x, y } = point;
    const top = this.getPoint(x, y - 1);
    const topRight = this.getPoint(x + 1, y - 1);
    const right = this.getPoint(x + 1, y);
    const rightBottom = this.getPoint(x + 1, y + 1);
    const bottom = this.getPoint(x, y + 1);
    const leftBottom = this.getPoint(x - 1, y + 1);
    const left = this.getPoint(x - 1, y);
    const leftTop = this.getPoint(x - 1, y - 1);
    return [
      top,
      right,
      bottom,
      left,
      topRight,
      rightBottom,
      leftBottom,
      leftTop
    ].filter(v => v);
  }

  /**
   * 计算单个节点的G值 = 父节点的G值 + 父节点到当前点的移动代价
   * @param point
   * @param parentPoint
   * @returns {number}
   */
  computeG(point, parentPoint) {
    const base = point.x === parentPoint.x || point.y === parentPoint.y
      ? 1 // 走直线的G因素
      : 1.4; // 走斜线的G因素
    return base + (parentPoint.G || 0);
  }
  /**
   * 计算单个节点的H值 = 曼哈顿距离
   * 当前节点到结束节点的x,y的差值和
   * @param point
   * @param endPoint
   * @returns {number}
   */
  computeH(point, endPoint) {
    return Math.abs(endPoint.x - point.x) + Math.abs(endPoint.y - point.y);
  }
  findPath(startPoint, endPoint, path = []) {
    if (!path.length) {
      console.info(`从 ${startPoint.x}, ${startPoint.y}出发`);
    }

    startPoint.active = true;

    this.closeList.push(startPoint);

    const neighbors = this.findNeighbor(startPoint)
      .filter(v => v.walkable === true)
      .filter(v => {
        // 跳过已检查的点
        // 好马不吃回头草，不然程序会死循环..
        return !this.closeList.some(c => c.is(v));
      })
      .map(point => {
        point.H = this.computeH(point, endPoint);
        point.G = this.computeG(point, startPoint);
        point.F = point.G + point.H;
        return point;
      });

    if (!neighbors || !neighbors.length) {
      alert(`寻路失败...`);
      return path;
    }

    const minFPoint = (neighbors.sort((a, b) => a.F - b.F) || [])[0];

    if (minFPoint) {
      if (minFPoint.H === 0) {
        console.log(`到达终点 ${startPoint.x}, ${startPoint.y}`);
        return path;
      }
      path.push(minFPoint);
      console.log(`下一个最佳点: ${minFPoint.x},${minFPoint.y}`);
      return this.findPath(minFPoint, endPoint, path);
    }
    return path;
  }
  setWalkable(x, y, walkable = true) {
    const point = this.getPoint(x, y);
    if (point) {
      point.setWalkable(!!walkable);
    }
    return this;
  }
}

class App extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    matrix: new Matrix(100, 100)
  };

  start(startPoint, endPoint) {
    const matrix = this.state.matrix;
    matrix
      .setWalkable(6, 1, false)
      .setWalkable(11, 12, false)
      .setWalkable(11, 12, false)
      .setWalkable(22, 85, false)
      .setWalkable(86, 13, false)
      .setWalkable(66, 41, false)
      .setWalkable(11, 11, false);
    const path = matrix.findPath(startPoint, endPoint);
    this.setState({ matrix });
    console.log(path);
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <button
            className="btn btn-default"
            onClick={() =>
              this.start(this.state.startPoint, this.state.endPoint)}
          >
            Findp
          </button>
        </div>

        <div>
          <p>
            起始点:{this.state.startPoint
              ? `${this.state.startPoint.x}, ${this.state.startPoint.y}`
              : ''}
          </p>

          <p>
            终点:{this.state.endPoint
              ? `${this.state.endPoint.x}, ${this.state.endPoint.y}`
              : ''}
          </p>

        </div>

        <div
          className="row"
          onMouseDown={e => {
            this.setState({ mouseDown: true });
          }}
          onMouseLeave={() => {
            this.setState({ mouseDown: false });
          }}
          onMouseUp={() => {
            this.setState({ mouseDown: false });
          }}
        >
          {this.state.matrix.array.map((row, i) => {
            return (
              <div key={i}>
                {row.map(point => {
                  return (
                    <div
                      key={point.x + ',' + point.y}
                      style={{
                        width: 10,
                        height: 10,
                        border: '1px solid #e3e3e3',
                        backgroundColor: point.active
                          ? '#43A047'
                          : !point.walkable ? '#9E9E9E' : '',
                        fontSize: 12
                      }}
                      onClick={() => {
                        const { startPoint, endPoint } = this.state;
                        if (!startPoint) {
                          this.setState({ startPoint: point });
                        } else if (!endPoint) {
                          this.setState({ endPoint: point });
                        } else {
                          this.setState({
                            startPoint: endPoint,
                            endPoint: point
                          });
                        }
                      }}
                      onMouseMove={e => {
                        if (this.state.mouseDown) {
                          const matrix = this.state.matrix;
                          matrix.setWalkable(point.x, point.y, false);
                          this.setState({ matrix });
                        }
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default App;
