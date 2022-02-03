import { TestBed } from '@angular/core/testing';
import { setupEmulators } from 'src/app/utils/tests/TestUtils.spec';
import { ErrorDAO } from '../ErrorLoggerService';

describe('ErrorDAO', () => {

    let dao: ErrorDAO;

    beforeEach(async() => {
        await setupEmulators();
        dao = TestBed.inject(ErrorDAO);
    });
    it('should be created', () => {
        expect(dao).toBeTruthy();
    });
});
