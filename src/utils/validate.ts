import joi from "joi"

interface Data {
    username: string,
    email: string,
    password: string
}
export const validateReg = (data: Data) => {
  const schema = joi.object({
    username: joi.string().min(3).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateLogin = (data: Data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  return schema.validate(data);
};

