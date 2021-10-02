import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { NumberEncoder } from 'src/app/jscaip/Encoder';
import { MoveCoordToCoord } from 'src/app/jscaip/MoveCoordToCoord';
import { MGPFallible } from 'src/app/utils/MGPFallible';
import { JSONValue } from 'src/app/utils/utils';
import { NeutronState } from './NeutronState';

export class NeutronMove extends MoveCoordToCoord {
    public static encoder: NumberEncoder<NeutronMove> =
        MoveCoordToCoord.getEncoder<NeutronMove>(NeutronState.SIZE, NeutronState.SIZE,
                                                       (start: Coord, end: Coord): NeutronMove => {
                                                           return NeutronMove.of(start, end).get();
                                                       });

    public static of(start: Coord, end: Coord): MGPFallible<NeutronMove> {
        const directionOptional: MGPFallible<Direction> = Direction.factory.fromMove(start, end);
        if (directionOptional.isFailure()) {
            return MGPFallible.failure(directionOptional.getReason());
        }
        if (start.isNotInRange(NeutronState.SIZE, NeutronState.SIZE)) {
            return MGPFallible.failure('start coord is not in range');
        }
        if (end.isNotInRange(NeutronState.SIZE, NeutronState.SIZE)) {
            return MGPFallible.failure('end coord is not in range');
        }
        return MGPFallible.success(new NeutronMove(start, end, directionOptional.get()));
    }
    private constructor(start: Coord, end: Coord, public readonly direction: Direction) {
        super(start, end);
        this.direction = Direction.factory.fromMove(start, end).get();
    }
    public equals(o: NeutronMove): boolean {
        if (o === this) return true;
        if (!o.coord.equals(this.coord)) return false;
        return o.end.equals(this.end);
    }
    public toString(): string {
        return 'NeutronMove(' + this.coord + '->' + this.end + ')';
    }
    public encode(): JSONValue {
        return NeutronMove.encoder.encode(this);
    }
    public decode(encodedMove: JSONValue): NeutronMove {
        return NeutronMove.encoder.decode(encodedMove);
    }

}
