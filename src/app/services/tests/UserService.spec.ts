import { UserService } from '../UserService';
import { ActivesUsersService } from '../ActivesUsersService';
import { JoueursDAO } from 'src/app/dao/JoueursDAO';
import { JoueursDAOMock } from 'src/app/dao/tests/JoueursDAOMock.spec';

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        const joueursDAOMock: JoueursDAOMock = new JoueursDAOMock();
        service = new UserService(new ActivesUsersService(joueursDAOMock as unknown as JoueursDAO),
                                  joueursDAOMock as unknown as JoueursDAO);
    });
    it('should create', () => {
        expect(service).toBeTruthy();
    });
});
