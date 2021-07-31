import { NumberEncoder } from 'src/app/jscaip/Encoder';
import { Player } from 'src/app/jscaip/Player';
import { ComparableObject } from 'src/app/utils/Comparable';
import { assert } from 'src/app/utils/utils';

export class YinshPiece implements ComparableObject {
    public static encoder: NumberEncoder<YinshPiece> =
        NumberEncoder.ofCombination<YinshPiece, [Player, boolean]>(
            [Player.numberEncoder, NumberEncoder.booleanEncoder],
            (piece: YinshPiece): [Player, boolean] => [piece.player, piece.isRing],
            ([player, isRing]: [Player, boolean]): YinshPiece => {
                return YinshPiece.of(player, isRing);
            },
        );

    public static EMPTY: YinshPiece = new YinshPiece(Player.NONE, false);

    public static MARKER_ZERO: YinshPiece = new YinshPiece(Player.ZERO, false);
    public static MARKER_ONE: YinshPiece = new YinshPiece(Player.ONE, false);
    public static MARKERS: [YinshPiece, YinshPiece] = [YinshPiece.MARKER_ZERO, YinshPiece.MARKER_ONE];

    public static RING_ZERO: YinshPiece = new YinshPiece(Player.ZERO, true);
    public static RING_ONE: YinshPiece = new YinshPiece(Player.ONE, true);
    public static RINGS: [YinshPiece, YinshPiece] = [YinshPiece.RING_ZERO, YinshPiece.RING_ONE];

    public static of(player: Player, isRing: boolean): YinshPiece {
        if (player === Player.NONE) {
            return YinshPiece.EMPTY;
        } else {
            if (isRing) {
                return YinshPiece.RINGS[player.value];
            } else {
                return YinshPiece.MARKERS[player.value];
            }
        }
    }

    private constructor(public player: Player, public isRing: boolean) {
    }
    public equals(piece: YinshPiece): boolean {
        return this === piece;
    }
    public flip(): YinshPiece {
        assert(this.isRing === false, 'cannot flip a ring (it should never happen)');
        assert(this.player !== Player.NONE, 'cannot flip a non-piece (it should never happen)');
        return YinshPiece.of(this.player.getOpponent(), this.isRing);
    }
    public toString(): string {
        switch (this) {
            case YinshPiece.EMPTY: return 'EMPTY';
            case YinshPiece.MARKER_ZERO: return 'MARKER_ZERO';
            case YinshPiece.MARKER_ONE: return 'MARKER_ONE';
            case YinshPiece.RING_ZERO: return 'RING_ZERO';
            case YinshPiece.RING_ONE: return 'RING_ONE';
        }
    }
}