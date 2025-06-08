import { UserModel } from '../models/user.model.js';
export class UserService {
    async createUser(userData) {
        if (!userData.fullname || !userData.email || !userData.password) {
            throw new Error("All fields are required");
        }
        const user = await UserModel.create({
            fullname: {
                firstname: userData.fullname.firstname,
                lastname: userData.fullname.lastname,
            },
            email: userData.email,
            password: userData.password,
            role: userData.role || 'user',
            username: userData.username,
            avatar: userData.avatar,
            googleId: userData.googleId,
        });
        return user;
    }
}
