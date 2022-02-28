export class RecordOfArrays<T> {
  private map: Record<string, T[]> = {};

  add = (key: string, value: T) => {
    if (!this.map[key]) {
      this.map[key] = [];
    }
    this.map[key].push(value);
  };

  toObject = () => this.map;
}
