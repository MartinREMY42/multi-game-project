import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { NodeUnheritance } from 'src/app/jscaip/NodeUnheritance';
import { GameStatus, Rules } from 'src/app/jscaip/Rules';
import { NeutronMove } from './NeutronMove';
import { NeutronState } from './NeutronState';


export abstract class NeutronNode extends MGPNode<NeutronRules,
                                                        NeutronMove,
                                                        NeutronState> {}

export class NeutronRules extends Rules<NeutronMove, NeutronState> {

    public isLegal(move: NeutronMove, state: NeutronState): LegalityStatus {
        throw new Error('Method not implemented.');
    }
    public getGameStatus(node: MGPNode<Rules<NeutronMove, NeutronState, LegalityStatus>, NeutronMove, NeutronState, LegalityStatus, NodeUnheritance>): GameStatus {
        throw new Error('Method not implemented.');
    }

    public applyLegalMove(move: NeutronMove, slice: NeutronState, status: LegalityStatus): NeutronState {
        return slice.applyLegalMove(move);
    }
}
