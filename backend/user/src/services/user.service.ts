import User from '../models/user.model.js';

interface UserData {
    fullname: {
        firstname: string;
        lastname: string;
    };
    email: string;
    password: string;
    role: string;
    username: string;
    avatar?: string;
    googleId?: string;
}

const createUser = async ({ fullname, email, password, role, username, avatar, googleId }: UserData) => {
    if (!fullname || !email || !password) {
        throw new Error("All fields are required");
    }

    const user = await User.create({
        fullname: {
            firstname: fullname.firstname,
            lastname: fullname.lastname,
        },
        email,
        password,
        role,
        username,
        avatar,
        googleId
    });

    return user;
};

export default {
    createUser
};