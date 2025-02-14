import express from "express";
import { Config } from "../config";

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  if (req.body.username != null && req.body.password != null) {
    const token = await Config.dependencies.authHandler.login(
      req.body.username,
      req.body.password
    );

    if (token != null) {
      res.send({ message: "success", token });
    } else {
      res.status(401).send({ message: 'Invalid Login Credentials' })
    }

  } else {
    res.status(400).send({ message: "Missing Username or Password in request body" });
  }
});

authRouter.put('/user', async (req, res) => {
  if (req.auth.userRole.roleType === 'Admin') { // I'm requiring the user token be an Admin
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email
    const roleType = req.body.roleType
    const campus = req.body.campus

    try {
      await Config.dependencies.authHandler.updateUser(username, password, { email, roleType, campus })
      res.send({ message: 'success' })
    } catch (error) {
      console.log(JSON.stringify(error))
      res.status(500).send({ message: 'Error occurred during user update', error: error.message })
    }

  } else {
    res.status(401).send({ message: 'Improper Caller RoleType'})
  }
})

authRouter.post('/user', async (req, res) => {
  if (req.auth.userRole.roleType === 'Admin') { // I'm requiring the user token be an Admin
    if (!checkForUserBody(req.body)) {
      res.status(400).send({ message: 'Missing User Data in Call' })
    } else {
      const userData = {
        username: req.body.username,
        password: req.body.password,
        userRole: {
          email: req.body.email,
          roleType: req.body.roleType,
          campus: req.body.campus
        }
      }
  
      try {
        await Config.dependencies.authHandler.createUser(userData.username, userData.password, userData.userRole)
        res.send({ message: 'success' })
      } catch (error) {
        console.log(JSON.stringify(error))
        res.status(500).send({ message: 'Error occurred during user creation', error: error.message })
      }
  
    }
  } else {
    res.status(401).send({ message: 'Improper Caller RoleType'})
  }
})

authRouter.delete('/user/:username', async (req, res) => {
  if (req.auth.userRole.roleType === 'Admin') { // I'm requiring the user token be an Admin  
    try {
      await Config.dependencies.authHandler.deleteUser(req.params?.username)
      res.send({ message: 'success' })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'Error occurred during user deletion', error: error.message })
    }  
  } else {
    res.status(400).send({ message: 'Missing Username or Improper Caller RoleType'})
  }
})

function checkForUserBody (body): boolean {
  return body.username != null && body.password != null && body.email != null && body.roleType != null && body.campus != null
}

module.exports = { authRouter };
