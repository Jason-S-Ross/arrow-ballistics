class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}


class Position extends Point {
    add(other: Position): Position {
        return new Position(this.x + other.x, this.y + other.y);
    }
}

class Velocity extends Point {
    scale(factor: number): Velocity {
        return new Velocity(this.x * factor, this.y * factor);
    }
    add(other: Velocity): Velocity {
        return new Velocity(this.x + other.x, this.y + other.y);
    }
}


class State {
    position: Position;
    v: number;
    theta: number;
    psi: number;
    psi_dot: number;
    constructor(position: Position, v: number, theta: number, psi: number, psi_dot: number) {
        this.position = position;
        this.v = v;
        this.theta = theta;
        this.psi = psi;
        this.psi_dot = psi_dot;
    }
    add(other: State): State {
        return new State(
            this.position.add(other.position),
            this.v + other.v,
            this.theta + other.theta,
            this.psi + other.psi,
            this.psi_dot + other.psi_dot,
        );
    }
}

interface Record {
    position: Position,
    v: number,
    theta: number,
    psi: number,
    psi_dot: number,
    t: number,
}

class Rate {
    velocity: Velocity;
    a: number;
    theta_dot: number;
    psi_dot: number;
    psi_2dot: number;
    constructor(
        velocity: Velocity,
        a: number,
        theta_dot: number,
        psi_dot: number,
        psi_2dot: number
    ) {
        this.velocity = velocity;
        this.a = a;
        this.theta_dot = theta_dot;
        this.psi_dot = psi_dot;
        this.psi_2dot = psi_2dot;
    }
    add(other: Rate): Rate {
        return new Rate(
            this.velocity.add(other.velocity),
            this.a + other.a,
            this.theta_dot + other.theta_dot,
            this.psi_dot + other.psi_dot,
            this.psi_2dot + other.psi_2dot,
        )
    }
    scale(fac: number): Rate {
        return new Rate(
            this.velocity.scale(fac),
            this.a * fac,
            this.theta_dot * fac,
            this.psi_dot * fac,
            this.psi_2dot * fac,
        )
    }
    step(dt: number): State {
        return new State(
            this.velocity.scale(dt),
            this.a * dt,
            this.theta_dot * dt,
            this.psi_dot * dt,
            this.psi_2dot * dt,
        )
    }
}

class Body {
    mass: number;
    inertia: number;
    g: number;  // Gravitational acceleration
    c_d: number; // Coefficient of drag
    c_l: number; // Coefficient of lift
    rho: number; // Mass density of air
    a_d: number; // Drag area
    a_l: number; // Lift area
    col: Point; // Center of Lift
    cod: Point; // Center of Drag
    cot: Point; // Center of Thrust
    t: number; // Thrust

    constructor(mass: number, inertia: number, g: number, rho: number,
               c_d: number, c_l: number, a_d: number, a_l: number,
                col: Point, cod: Point, cot: Point, t: number){
        this.mass = mass;
        this.inertia = inertia;
        this.g = g;
        this.rho = rho;
        this.c_d = c_d;
        this.c_l = c_l;
        this.a_d = a_d;
        this.a_l = a_l;
        this.col = col;
        this.cod = cod;
        this.cot = cot;
        this.t = t;

    }
    get_acceleration(state: State): Rate {
        var a_l = Math.sqrt(Math.pow(Math.cos(state.psi) * this.a_l, 2)
            + Math.pow(Math.sin(state.psi) * this.a_d, 2))
        var a_d = Math.sqrt(Math.pow(Math.sin(state.psi) * this.a_l, 2)
            + Math.pow(Math.cos(state.psi) * this.a_d, 2))
        var k_l = Math.sin(state.psi) * this.c_l * a_l * this.rho;
        var L = k_l * state.v * state.v * 0.5;
        var k_d = Math.cos(state.psi) * this.c_d * a_d * this.rho;
        var D = k_d * state.v * state.v * 0.5;
        var weight = this.mass * this.g;
        var f_t = this.t - D - weight * Math.sin(state.theta);
        var f_l = L - weight * Math.cos(state.theta);
        var m = -this.cot.y * this.t
            + this.col.x * L * Math.cos(state.psi)
            - this.col.y * L * Math.sin(state.psi)
            + this.cod.x * D * Math.sin(state.psi)
            + this.cod.y * D * Math.cos(state.psi);
        var dtheta = f_l / (this.mass * state.v);
        return new Rate(
            new Velocity(
                Math.cos(state.theta) * state.v,
                Math.sin(state.theta) * state.v,
            ),
            f_t / this.mass,
            dtheta,
            state.psi_dot - dtheta,
            m / this.inertia,
        );
    }
    step(state: State, dt: number): State {
        var k1 = this.get_acceleration(state);
        var step1 = k1.step(0.5 * dt);
        var k2 = this.get_acceleration(state.add(step1));
        var step2 = k2.step(0.5 * dt);
        var k3 = this.get_acceleration(state.add(step2));
        var step3 = k3.step(dt);
        var k4 = this.get_acceleration(state.add(step3));
        return state
            .add(k1.step(dt / 6))
            .add(k2.step(dt / 3))
            .add(k3.step(dt / 3))
            .add(k4.step(dt / 6));
    }
    step_euler(state: State, dt: number): State {
        var accel = this.get_acceleration(state);
        return state.add(accel.step(dt));
    }
}

class Arrow {
    private _mass: number;
    private _headMass: number;
    private _diameter: number;
    private _length: number;
    private _fletchingArea: number;
    private _c_d: number;
    private _c_l: number;
    private _body: Body;
    public get mass() {
        return this._mass;
    }
    public set mass(value) {
        this._mass = value;
        this.update()
    }
    public get headMass() {
        return this._headMass
    }
    public set headMass(value) {
        this._headMass = value;
        this.update();
    }
    public get length() {
        return this._length
    }
    public set length(value) {
        this._length = value;
        this.update();
    }
    public get fletchingArea() {
        return this._fletchingArea
    }
    public set fletchingArea(value) {
        this._fletchingArea = value;
        this.update();
    }
    public get c_d() {
        return this._c_d;
    }
    public set c_d(value) {
        this._c_d = value;
        this.update();
    }
    public get c_l() {
        return this._c_l;
    }
    public set c_l(value) {
        this._c_l = value;
        this.update();
    }
    public get body() {
        return this._body;
    }
    private get_body(): Body {
        var alpha = this._headMass / this._mass;
        var inertia = (this._mass * Math.pow(this._length, 2) * (1 - alpha) * (1 + 3 * alpha)) / 12;
        var cg_offset = this._length / 2 * alpha;
        var fletching_drag = this._fletchingArea * 0.005;
        var drag_area = Math.PI / 4 * Math.pow(this._diameter, 2);
        var total_drag = drag_area * this._c_d + fletching_drag;
        var adjusted_c_d = total_drag / drag_area;
        var body_lift_area = this._length * this._diameter;
        var lift_area = this._fletchingArea + body_lift_area;
        var lift_offset = this._length / 2 * this._fletchingArea / lift_area;
        var lift_position = new Point(- lift_offset - cg_offset, 0);
        var drag_position = lift_position;
        var thrust_position = new Point(0, 0);
        return new Body(
            this._mass,
            inertia,
            9.8,
            1.2,
            adjusted_c_d,
            this._c_l,
            drag_area,
            lift_area,
            lift_position,
            drag_position,
            thrust_position,
            0
        );
    }
    private update() {
        this._body = this.get_body();
    }
    constructor(
        mass: number,
        headMass: number,
        diameter: number,
        length: number,
        fletchingArea: number,
        c_d: number,
        c_l: number,
    ) {
        this._mass = mass;
        this._headMass = headMass;
        this._diameter = diameter;
        this._length = length;
        this._fletchingArea = fletchingArea;
        this._c_d = c_d;
        this._c_l = c_l;
        this._body = this.get_body();
    }
    step(state: State, dt: number): State {
        return this._body.step(state, dt);
    }
    step_euler(state: State, dt: number): State {
        return this._body.step_euler(state, dt);
    }
}

export { Arrow, Body, State, Rate, Point, Position, Velocity, Record }
