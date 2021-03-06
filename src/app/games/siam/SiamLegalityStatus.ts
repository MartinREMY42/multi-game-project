import { MGPValidation } from 'src/app/utils/MGPValidation';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { Coord } from 'src/app/jscaip/Coord';

export class SiamLegalityStatus implements LegalityStatus {
    public static failure(reason: string): SiamLegalityStatus {
        return { legal: MGPValidation.failure(reason), resultingBoard: null, moved: [] };
    }

    public legal: MGPValidation;

    public resultingBoard: number[][];

    public moved: Coord[];
}
