import { ActivesPartsService } from '../ActivesPartsService';
import { PartDAO } from 'src/app/dao/PartDAO';
import { PartDAOMock } from 'src/app/dao/tests/PartDAOMock.spec';

describe('ActivesPartsService', () => {
    let service: ActivesPartsService;

    beforeEach(() => {
        service = new ActivesPartsService(new PartDAOMock() as unknown as PartDAO);
    });
    it('should create', () => {
        expect(service).toBeTruthy();
    });
});
