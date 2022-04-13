import { NumberEncoder } from 'src/app/jscaip/Encoder';
import { Player, PlayerOrNone } from 'src/app/jscaip/Player';
import { ComparableObject } from 'src/app/utils/Comparable';
import { Utils } from 'src/app/utils/utils';
import { assert } from 'src/app/utils/assert';

export class YinshPiece implements ComparableObject {

    public static encoder: NumberEncoder<YinshPiece> =
        NumberEncoder.tuple<YinshPiece, [PlayerOrNone, boolean]>(
            [Player.numberEncoder, NumberEncoder.booleanEncoder],
            (piece: YinshPiece): [PlayerOrNone, boolean] => [piece.player, piece.isRing],
            (fields: [Player, boolean]): YinshPiece => {
                return YinshPiece.of(fields[0], fields[1]);
            },
        );
    public static NONE: YinshPiece = new YinshPiece(PlayerOrNone.NONE, false);

    public static EMPTY: YinshPiece = new YinshPiece(PlayerOrNone.NONE, false);

    public static MARKER_ZERO: YinshPiece = new YinshPiece(Player.ZERO, false);
    public static MARKER_ONE: YinshPiece = new YinshPiece(Player.ONE, false);
    public static MARKERS: [YinshPiece, YinshPiece] = [YinshPiece.MARKER_ZERO, YinshPiece.MARKER_ONE];

    public static RING_ZERO: YinshPiece = new YinshPiece(Player.ZERO, true);
    public static RING_ONE: YinshPiece = new YinshPiece(Player.ONE, true);
    public static RINGS: [YinshPiece, YinshPiece] = [YinshPiece.RING_ZERO, YinshPiece.RING_ONE];

    public static of(player: Player, isRing: boolean): YinshPiece {
        if (player === PlayerOrNone.NONE) {
            return YinshPiece.EMPTY;
        } else {
            if (isRing) {
                return YinshPiece.RINGS[player.value];
            } else {
                return YinshPiece.MARKERS[player.value];
            }
        }
    }

    private constructor(public readonly player: PlayerOrNone, public readonly isRing: boolean) {
    }
    public equals(piece: YinshPiece): boolean {
        return this === piece;
    }
    public flip(): YinshPiece {
        assert(this.isRing === false, 'cannot flip a ring (it should never happen)');
        assert(this.player.isPlayer(), 'cannot flip a non-player piece');
        const player: Player = this.player as Player;
        return YinshPiece.of(player.getOpponent(), this.isRing);
    }
    public toString(): string {
        switch (this) {
            case YinshPiece.NONE: return 'NONE';
            case YinshPiece.EMPTY: return 'EMPTY';
            case YinshPiece.MARKER_ZERO: return 'MARKER_ZERO';
            case YinshPiece.MARKER_ONE: return 'MARKER_ONE';
            case YinshPiece.RING_ZERO: return 'RING_ZERO';
            default:
                Utils.expectToBe(this, YinshPiece.RING_ONE);
                return 'RING_ONE';
        }
    }
}
