import { Coord } from 'src/app/jscaip/Coord';
import { NumberEncoder } from 'src/app/jscaip/Encoder';
import { HexaBoard } from 'src/app/jscaip/HexaBoard';
import { ArrayUtils, NumberTable, Table } from 'src/app/utils/ArrayUtils';
import { GipfPiece } from './GipfPiece';

export class GipfBoard extends HexaBoard<GipfPiece> {
    private static pieceEncoder: NumberEncoder<GipfPiece> = GipfPiece.encoder;

    public static of(table: Table<GipfPiece>): GipfBoard {
        return new GipfBoard(table);
    }

    public constructor(public readonly contents: Table<GipfPiece>) {
        super(contents, 7, 7, [3, 2, 1], GipfPiece.EMPTY);
    }
    public toNumberTable(): NumberTable {
        return ArrayUtils.mapBiArray(this.contents, GipfBoard.pieceEncoder.encodeNumber);
    }
    protected setAtUnsafe(coord: Coord, v: GipfPiece): this {
        // TODO: this is duplicated from HexaBoard but required for safety, how can we avoid this?
        const contents: GipfPiece[][] = ArrayUtils.copyBiArray(this.contents);
        contents[coord.y][coord.x] = v;
        return new GipfBoard(contents) as this;
    }
}
