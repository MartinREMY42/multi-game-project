import { Coord } from 'src/app/jscaip/coord/Coord';
import { Direction, Vector } from 'src/app/jscaip/Direction';
import { Move } from 'src/app/jscaip/Move';
import { MGPOptional } from 'src/app/utils/mgp-optional/MGPOptional';
import { CoerceoFailure } from '../CoerceoFailure';

export class CoerceoStep {

    public static LEFT: CoerceoStep = new CoerceoStep(new Vector(-2, 0));

    public static UP_LEFT: CoerceoStep = new CoerceoStep(Direction.UP_LEFT);

    public static UP_RIGHT: CoerceoStep = new CoerceoStep(Direction.UP_RIGHT);

    public static RIGHT: CoerceoStep = new CoerceoStep(new Vector(2, 0));

    public static DOWN_LEFT: CoerceoStep = new CoerceoStep(Direction.DOWN_LEFT);

    public static DOWN_RIGHT: CoerceoStep = new CoerceoStep(Direction.DOWN_RIGHT);

    public static readonly STEPS: CoerceoStep[] = [
        CoerceoStep.LEFT,
        CoerceoStep.UP_LEFT,
        CoerceoStep.UP_RIGHT,
        CoerceoStep.RIGHT,
        CoerceoStep.DOWN_LEFT,
        CoerceoStep.DOWN_RIGHT,
    ];
    public static fromCoords(a: Coord, b: Coord): CoerceoStep {
        const vector: Vector = a.getVectorToward(b);
        const stepIndex: number = CoerceoStep.STEPS.findIndex((s: CoerceoStep) => Vector.equals(s.direction, vector));
        if (stepIndex === -1) {
            throw new Error(CoerceoFailure.INVALID_DISTANCE);
        } else {
            return CoerceoStep.STEPS[stepIndex];
        }
    }
    private constructor(public readonly direction: Vector) {}

    public toInt(): number {
        return CoerceoStep.STEPS.findIndex((s: CoerceoStep) => Vector.equals(s.direction, this.direction));
    }
    public toString(): string {
        switch (this) {
            case CoerceoStep.LEFT: return 'LEFT';
            case CoerceoStep.UP_LEFT: return 'UP_LEFT';
            case CoerceoStep.UP_RIGHT: return 'UP_RIGHT';
            case CoerceoStep.RIGHT: return 'RIGHT';
            case CoerceoStep.DOWN_LEFT: return 'DOWN_LEFT';
            case CoerceoStep.DOWN_RIGHT: return 'DOWN_RIGHT';
        }
    }
}

export class CoerceoMove extends Move {

    public static decode(encodedMove: number): CoerceoMove {
        if (encodedMove % 1 !== 0) {
            throw new Error('EncodedMove must be an integer.');
        }
        const cy: number = encodedMove % 10;
        encodedMove = (encodedMove - cy) / 10;
        const cx: number = encodedMove % 15;
        encodedMove = (encodedMove - cx) / 15;
        if (encodedMove === 0) {
            return CoerceoMove.fromTilesExchange(new Coord(cx, cy));
        } else {
            return CoerceoMove.fromDeplacement(new Coord(cx, cy), CoerceoStep.STEPS[encodedMove - 1]);
        }
    }
    public static fromDeplacement(start: Coord,
                                  step: CoerceoStep): CoerceoMove
    {
        if (start.isNotInRange(15, 10)) {
            throw new Error('Starting coord cannot be out of range (width: 15, height: 10).');
        }
        if (step == null) {
            throw new Error('Step cannot be null.');
        }
        if (!(step instanceof CoerceoStep)) {
            throw new Error(CoerceoFailure.INVALID_DISTANCE);
        }
        const landingCoord: Coord = new Coord(start.x + step.direction.x, start.y + step.direction.y);
        if (landingCoord.isNotInRange(15, 10)) {
            throw new Error('Landing coord cannot be out of range (width: 15, height: 10).');
        }
        return new CoerceoMove(MGPOptional.of(start),
                               MGPOptional.of(step),
                               MGPOptional.of(landingCoord),
                               MGPOptional.empty());
    }
    public static fromTilesExchange(capture: Coord): CoerceoMove {
        if (capture.isNotInRange(15, 10)) {
            throw new Error('Captured coord cannot be out of range (width: 15, height: 10).');
        }
        return new CoerceoMove(MGPOptional.empty(),
                               MGPOptional.empty(),
                               MGPOptional.empty(),
                               MGPOptional.of(capture));
    }
    public static fromCoordToCoord(start: Coord, end: Coord): CoerceoMove {
        const step: CoerceoStep = CoerceoStep.fromCoords(start, end);
        return CoerceoMove.fromDeplacement(start, step);
    }
    private constructor(public readonly start: MGPOptional<Coord>,
                        public readonly step: MGPOptional<CoerceoStep>,
                        public readonly landingCoord: MGPOptional<Coord>,
                        public readonly capture: MGPOptional<Coord>)
    {
        super();
    }
    public isTileExchange(): boolean {
        return this.capture.isPresent();
    }
    public toString(): string {
        if (this.isTileExchange()) {
            return 'CoerceoMove(' + this.capture.get().toString() + ')';
        } else {
            return 'CoerceoMove(' + this.start.get().toString() + ' > ' +
                   this.step.get().toString() + ' > ' +
                   this.landingCoord.get().toString() + ')';
        }
    }
    public equals(o: CoerceoMove): boolean {
        if (o == null) {
            return false;
        }
        if (!this.capture.equals(o.capture, Coord.equals)) {
            return false;
        }
        if (!this.start.equals(o.start, Coord.equals)) {
            return false;
        }
        return this.landingCoord.equals(o.landingCoord, Coord.equals);
    }
    public encode(): number {
        // tileExchange: cx, cy
        // deplacements: step, cx, cy
        if (this.isTileExchange()) {
            const cy: number = this.capture.get().y; // [0, 9]
            const cx: number = this.capture.get().x; // [0, 14]
            return (cx * 10) + cy;
        } else {
            const cy: number = this.start.get().y; // [0, 9]
            const cx: number = this.start.get().x; // [0, 14]
            const step: number = this.step.get().toInt() + 1; // [1, 6]
            return (step * 150) + (cx * 10) + cy;
        }
    }
    public decode(encodedMove: number): Move {
        return CoerceoMove.decode(encodedMove);
    }
}