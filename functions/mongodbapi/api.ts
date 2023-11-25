import { User } from "./schema";

export const singUp = async (
  email: string,
  username: string,
  password: string
) => {
  try {
    if (!username || !password || !email) {
      return {
        status: 400,
        message: "Plz provide username and password",
      };
    }

    const user = await User.findOne({ email });
    if (user) {
      return {
        status: 200,
        message: "User exist",
      };
    }

    const _locker = {
      locker_id: "0",
      locker_status: "FALSE",
    };

    const { locker_id, locker_status } = _locker;

    const newUser = new User({
      email,
      username,
      password,
      locker: { locker_id, locker_status },
    });

    await newUser.save();

    return {
      status: 200,
      message: "User save to db",
    };
  } catch (error) {
    return {
      status: 500,
      message: error,
    };
  }
};

export const singIn = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      return {
        status: 400,
        message: "Plz provide email and password",
      };
    }

    const user = await User.findOne({ email, password });

    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }

    return {
      status: 200,
      message: user.id,
    };
  } catch (error) {
    return {
      status: 500,
      message: error,
    };
  }
};

export const getUserById = async (userId: string) => {
  try {
    if (!userId) {
      return {
        status: 400,
        message: "Plz provide userId",
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    return {
      status: 200,
      message: {
        id: user._id,
        username: user.username,
        locker: user.locker,
      },
    };
  } catch (error) {
    return {
      status: 500,
      message: error,
    };
  }
};
