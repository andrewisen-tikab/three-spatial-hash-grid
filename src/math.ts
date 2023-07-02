class _Math {
    /**
     * {@link _Math} singleton
     */
    private static _instance: _Math;

    /**
     * Generate {@link _Math} singleton
     */
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public rand_range(a: number, b: number): number {
        return Math.random() * (b - a) + a;
    }

    public rand_normalish(): number {
        const r = Math.random() + Math.random() + Math.random() + Math.random();
        return (r / 4.0) * 2.0 - 1;
    }

    public rand_int(a: number, b: number): number {
        return Math.round(Math.random() * (b - a) + a);
    }

    lerp(x: number, a: number, b: number) {
        return x * (b - a) + a;
    }

    smoothstep(x: number, a: number, b: number): number {
        x = x * x * (3.0 - 2.0 * x);
        return x * (b - a) + a;
    }

    smootherstep(x: number, a: number, b: number) {
        x = x * x * x * (x * (x * 6 - 15) + 10);
        return x * (b - a) + a;
    }

    clamp(x: number, a: number, b: number): number {
        return Math.min(Math.max(x, a), b);
    }

    sat(x: number): number {
        return Math.min(Math.max(x, 0.0), 1.0);
    }
}

const math = _Math.Instance;

export default math;
