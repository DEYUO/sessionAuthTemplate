import {Hono} from "hono";
import {sessionCookieProtectedPath} from "../middlewares/Auth.js";
import {aLogger} from "../helpers/logger.js";
import users from "../models/Users.js";
import Users from "../models/Users.js";
import type {TUserGroup} from "../types/User.js";
import {hashPassword} from "../helpers/Auth.js";


const usersRouter = new Hono();

usersRouter.get('/', sessionCookieProtectedPath(), async (c) => {
  try {
    const data = await users.find().select('-hash')
    return c.json({users: data})
  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
})


usersRouter.get('/:id', sessionCookieProtectedPath(), async (c) => {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({error: "Invalid User ID."}, 400);
    }

    const user = await users.findById(id).select('-hash')

    if (!user) {
      return c.json({error: "User not found."}, 404);
    }

    return c.json(user)
  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
})

usersRouter.post('/', sessionCookieProtectedPath(['Administrator']), async (c) => {
  try {
    const body = await c.req.json();

    // Extract and validate required string fields
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return c.json({error: "Missing or invalid 'name', 'email', or 'password'."}, 400);
    }

    // Validate and assign status
    if (typeof body.status !== 'boolean') {
      return c.json({error: "'status' must be a boolean."}, 400);
    }
    const status: boolean = body.status;

    // Validate and assign group
    const validGroups: TUserGroup[] = ["Administrator", "Manager", "User"];
    const group: TUserGroup = validGroups.includes(body.group) ? body.group : "User";

    // Check for duplicate email
    if (await users.findOne({email})) {
      return c.json({error: 'A user with the same email address exists'}, 400);
    }

    // Hash password and save
    const hashedPassword = await hashPassword(password);

    const newUser = new Users({
      name,
      email,
      hash: hashedPassword,
      status,
      group,
    });

    await newUser.save();

    const user = await users.findOne({email}).select('-hash');

    return c.json(user);

  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
})

usersRouter.put('/:id', sessionCookieProtectedPath(['Administrator']), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate ID (assuming MongoDB)
    if (!id) {
      return c.json({error: "Invalid User ID."}, 400);
    }

    // Validate and sanitize input
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const status = body.status;
    const group = body.group;

    if (!name || !email) {
      return c.json({error: "Missing or invalid 'name' or 'email'."}, 400);
    }

    if (typeof status !== 'boolean') {
      return c.json({error: "'status' must be a boolean."}, 400);
    }

    const validGroups: TUserGroup[] = ["Administrator", "Manager", "User"];
    if (!validGroups.includes(group)) {
      return c.json({error: `'group' must be one of ${validGroups.join(', ')}.`}, 400);
    }

    // Find and update user
    const user = await users.findById(id);

    if (!user) {
      return c.json({error: "User not found."}, 404);
    }

    user.name = name;
    user.email = email;
    user.status = status;
    user.group = group;

    await user.save();

    const updatedUser = await users.findById(id).select('-hash');
    return c.json(updatedUser);

  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
});

usersRouter.put('/:id/password', sessionCookieProtectedPath(['Administrator']), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const password = typeof body.password === 'string' ? body.password : '';

    if (!id) {
      return c.json({error: "Invalid User ID."}, 400);
    }

    if (!password) {
      return c.json({error: "Missing or invalid 'password'."}, 400);
    }

    // Find and update user
    const user = await users.findById(id);

    if (!user) {
      return c.json({error: "User not found."}, 404);
    }

    // hash the password
    user.hash = await hashPassword(password);

    await user.save()

    const updatedUser = await users.findById(id).select('-hash');
    return c.json(updatedUser);

  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
})


usersRouter.delete('/:id', sessionCookieProtectedPath(['Administrator']), async (c) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({error: "Invalid User ID."}, 400);
    }

    const user = await users.findById(id)

    if (!user) {
      return c.json({error: "User not found."}, 404);
    }

    await user.deleteOne()

    return c.json({status: true});
  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({error: e.message}, 500);
    }
    return c.json({error: "Unexpected error"}, 500);
  }
})

export default usersRouter;