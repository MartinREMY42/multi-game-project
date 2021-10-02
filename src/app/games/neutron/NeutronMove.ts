import { Coord } from 'src/app/jscaip/Coord';
import { MoveEncoder } from 'src/app/jscaip/Encoder';
import { MoveCoord } from 'src/app/jscaip/MoveCoord';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { JSONObject, JSONValueWithoutArray } from 'src/app/utils/utils';

export class NeutronMove extends MoveCoord {

    public static encoder: MoveEncoder<NeutronMove> = new class extends MoveEncoder<NeutronMove> {
        public encodeMove(move: NeutronMove): JSONValueWithoutArray {
            const encoded: JSONValueWithoutArray = {
                coord: Coord.encoder.encode(move.coord),
            };

            return encoded;
        }
        public decodeMove(encoded: JSONValueWithoutArray): NeutronMove {
            const casted: JSONObject = encoded as JSONObject;

            const coord: Coord = Coord.encoder.decode(casted['coord']);
            
            return NeutronMove.move(coord.x, coord.y);
        }
    }
    public static move(x: number, y: number): NeutronMove {
        return new NeutronMove(x, y);
    }
    private constructor(x: number,
                        y: number)
    {
        super(x, y);
        if (this.coord.isNotInRange(5, 5)) {
            throw new Error('The board is a 6 cas wide square, invalid coord: ' + this.coord.toString());
        }
    }
    public toString(): string {
        return 'NeutronMove' + this.coord.toString();
    }
    public equals(o: NeutronMove): boolean {
        if (this.coord.equals(o.coord) === false) {
            return false;
        }
        return this.coord.equals(o.coord);
    }
}
