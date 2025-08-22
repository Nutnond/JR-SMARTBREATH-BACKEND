// services/machine.service.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Machine, User } = require('../models');

const createMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
    ownerId: Joi.string().uuid().required(),
});

const updateMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
});

const createMachine = async (machineData) => {
    const { error, value } = createMachineSchema.validate(machineData);
    if (error) throw new Error(`Validation error: ${error.details[0].message}`);

    const owner = await User.findByPk(value.ownerId);
    if (!owner) throw new Error('Owner not found.');

    const existingMachine = await Machine.findOne({ where: { deviceName: value.deviceName } });
    if (existingMachine) throw new Error('Device name is already taken.');

    return await Machine.create({ id: uuidv4(), ...value });
};

const getAllMachines = async (ownerId) => {
    const condition = ownerId ? { owner_id: ownerId } : null;
    return await Machine.findAll({ where: condition, include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }] });
};

const getMachineById = async (id) => {
    const machine = await Machine.findByPk(id, { include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }] });
    if (!machine) throw new Error('Machine not found.');
    return machine;
};

const updateMachine = async (id, updateData) => {
    const { error, value } = updateMachineSchema.validate(updateData);
    if (error) throw new Error(`Validation error: ${error.details[0].message}`);

    const machineToUpdate = await Machine.findByPk(id);
    if (!machineToUpdate) throw new Error('Machine not found.');

    if (value.device_name !== machineToUpdate.device_name) {
        const existingMachine = await Machine.findOne({ where: { device_name: value.device_name } });
        if (existingMachine) throw new Error('Device name is already taken.');
    }

    const [num] = await Machine.update(value, { where: { id: id } });
    if (num === 1) return await getMachineById(id);
    throw new Error('Failed to update machine.');
};

const deleteMachine = async (id) => {
    const num = await Machine.destroy({ where: { id: id } });
    if (num === 0) throw new Error('Machine not found.');
    return { message: 'Machine deleted successfully.' };
};

module.exports = { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine };