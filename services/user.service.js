// services/user.service.js
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const { Op } = require('sequelize');

const createUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    weight: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required()
});

const updateUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    weight: Joi.number().positive(),
    height: Joi.number().positive(),
    gender: Joi.string().valid('Male', 'Female', 'Other')
}).min(1);

const createUser = async (userData) => {
    
    const { error, value } = createUserSchema.validate(userData);
    if (error) throw new Error(`Validation error: ${error.details[0].message}`);



    const existingUser = await User.findOne({ where: { [Op.or]: [{ email: value.email }, { username: value.username }] } });
    if (existingUser) {
        if (existingUser.email === value.email) throw new Error('Email already in use.');
        if (existingUser.username === value.username) throw new Error('Username already taken.');
    }
    const hashedPassword = await bcrypt.hash(value.password, 10);
    const newUser = await User.create({
        id: uuidv4(), // สร้าง UUID ที่นี่
        ...value, // นำข้อมูลที่ผ่าน validation มาทั้งหมด
        password: hashedPassword // ใช้รหัสผ่านที่เข้ารหัสแล้ว
    });
    newUser.password = undefined;

    return newUser;
};

const getAllUsers = async () => {
    return await User.findAll({ attributes: { exclude: ['password'] } });
};

const getUserById = async (id) => {
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) throw new Error('User not found.');
    return user;
};

const updateUser = async (id, updateData) => {
    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) throw new Error('User not found.');

    const { error, value } = updateUserSchema.validate(updateData);
    if (error) throw new Error(`Validation error: ${error.details[0].message}`);

    if (value.username && value.username !== userToUpdate.username) {
        const existingUsername = await User.findOne({ where: { username: value.username } });
        if (existingUsername) throw new Error('Username already taken.');
    }
    if (value.email && value.email !== userToUpdate.email) {
        const existingEmail = await User.findOne({ where: { email: value.email } });
        if (existingEmail) throw new Error('Email already in use.');
    }

    const [num] = await User.update(value, { where: { id: id } });
    if (num === 1) return await getUserById(id);
    throw new Error('Failed to update user.');
};

const deleteUser = async (id) => {
    const num = await User.destroy({ where: { id: id } });
    if (num === 0) throw new Error('User not found.');
    return { message: 'User deleted successfully.' };
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };