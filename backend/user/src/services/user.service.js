"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const userModel = require('../models/user.model');
module.exports.createUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ fullname, email, password, role, username }) {
    if (!fullname || !email || !password) {
        throw new Error("All fields are required");
    }
    const user = userModel.create({
        fullname: {
            firstname: fullname.firstname,
            lastname: fullname.lastname,
        },
        email,
        password,
        role,
        username,
    });
    return user;
});
