import { IJoinerId, IJoiner } from 'src/app/domain/ijoiner';
import { MGPMap } from 'src/app/utils/MGPMap';
import { ObservableSubject } from 'src/app/utils/tests/ObservableSubject.spec';
import { display } from 'src/app/utils/utils';
import { FirebaseFirestoreDAOMock } from './FirebaseFirestoreDAOMock.spec';
import { JoinerMocks } from 'src/app/domain/JoinerMocks.spec';
import { fakeAsync } from '@angular/core/testing';
import { MGPOptional } from 'src/app/utils/MGPOptional';

type JoinerOS = ObservableSubject<IJoinerId>

export class JoinerDAOMock extends FirebaseFirestoreDAOMock<IJoiner> {

    public static VERBOSE: boolean = false;

    private static joinerDB: MGPMap<string, JoinerOS>;

    public constructor() {
        super('JoinerDAOMock', JoinerDAOMock.VERBOSE);
        display(this.VERBOSE, 'JoinerDAOMock.constructor');
    }
    public getStaticDB(): MGPMap<string, JoinerOS> {
        return JoinerDAOMock.joinerDB;
    }
    public resetStaticDB(): void {
        JoinerDAOMock.joinerDB = new MGPMap();
    }
}

describe('JoinerDAOMock', () => {

    let joinerDaoMock: JoinerDAOMock;

    let callCount: number;

    let lastJoiner: MGPOptional<IJoiner>;

    beforeEach(() => {
        joinerDaoMock = new JoinerDAOMock();
        callCount = 0;
        lastJoiner = MGPOptional.empty();
    });
    it('Total update should update', fakeAsync(async() => {
        await joinerDaoMock.set('joinerId', JoinerMocks.INITIAL.doc);

        expect(lastJoiner).toEqual(MGPOptional.empty());
        expect(callCount).toBe(0);

        joinerDaoMock.getObsById('joinerId').subscribe((iJoinerId: IJoinerId) => {
            callCount++;
            lastJoiner = MGPOptional.of(iJoinerId.doc);
            expect(callCount).withContext('Should not have been called more than twice').toBeLessThanOrEqual(2);
            // TODO: REDO
        });

        expect(callCount).toEqual(1);
        expect(lastJoiner.get()).toEqual(JoinerMocks.INITIAL.doc);

        await joinerDaoMock.update('joinerId', JoinerMocks.WITH_FIRST_CANDIDATE.doc);

        expect(callCount).toEqual(2);
        expect(lastJoiner.get()).toEqual(JoinerMocks.WITH_FIRST_CANDIDATE.doc);
    }));
    it('Partial update should update', fakeAsync(async() => {
        await joinerDaoMock.set('joinerId', JoinerMocks.INITIAL.doc);

        expect(callCount).toEqual(0);
        expect(lastJoiner).toEqual(MGPOptional.empty());

        joinerDaoMock.getObsById('joinerId').subscribe((iJoinerId: IJoinerId) => {
            callCount ++;
            // TODO: REDO
            expect(callCount).withContext('Should not have been called more than twice').toBeLessThanOrEqual(2);
            lastJoiner = MGPOptional.of(iJoinerId.doc);
        });

        expect(callCount).toEqual(1);
        expect(lastJoiner.get()).toEqual(JoinerMocks.INITIAL.doc);

        await joinerDaoMock.update('joinerId', { candidates: ['firstCandidate'] });

        expect(callCount).toEqual(2);
        expect(lastJoiner.get()).toEqual(JoinerMocks.WITH_FIRST_CANDIDATE.doc);
    }));
});
