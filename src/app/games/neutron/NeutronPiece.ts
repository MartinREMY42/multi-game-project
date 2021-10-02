import { Player } from 'src/app/jscaip/Player';
import { Orthogonal } from 'src/app/jscaip/Direction';

export class NeutronPiece {
    public static readonly EMPTY: NeutronPiece = new NeutronPiece(0);

    public static readonly NEUTRON: NeutronPiece = new NeutronPiece(1);

    public static readonly ZERO: NeutronPiece = new NeutronPiece(2);

    public static readonly ONE: NeutronPiece = new NeutronPiece(3);

    public static decode(value: number): NeutronPiece {
        switch (value) {
            case 0: return NeutronPiece.EMPTY;
            case 1: return NeutronPiece.NEUTRON;
            case 2: return NeutronPiece.ZERO;
            case 3: return NeutronPiece.ONE;
            default: throw new Error('Unknown value for NeutronPiece(' + value + ').');
        }
    }

    private constructor(public readonly value: number) {}
    
    public toString(): string {
        switch (this.value) {
            case 0: return 'EMPTY';
            case 1: return 'NEUTRON';
            case 2: return 'WHITE';
            case 3: return 'BLACK';
        }
    }
}
