require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();

const launchContexts = new Map();

const {
  AUTH_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  TOKEN_URL,
  REDIRECT_URI,
  FHIR_BASE,
  SCOPES,
} = process.env;
const STATE = "12345";

// Middleware
app.use(express.json());
app.use(
  express.static("views", {
    index: false, // This prevents automatic serving of index.html
  })
);

// Helper function to make FHIR API calls with retry mechanism
async function makeFhirRequest(url, accessToken, maxRetries = 4) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseUrl = FHIR_BASE;
      console.log(`Attempt ${attempt}/${maxRetries} - baseUrl:`, baseUrl);
      console.log(`Attempt ${attempt}/${maxRetries} - url:`, url);
      console.log(
        `Attempt ${attempt}/${maxRetries} - accessToken:`,
        accessToken
      );

      const response = await axios.get(`${baseUrl}${url}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/fhir+json",
          "Content-Type": "application/fhir+json",
        },
      });

      // Check if status is 200
      if (response.status === 200) {
        console.log(
          `Attempt ${attempt}/${maxRetries} - Success! Response:`,
          response.data
        );
        return response.data;
      } else {
        console.log(
          `Attempt ${attempt}/${maxRetries} - Non-200 status: ${response.status}`
        );
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        `Attempt ${attempt}/${maxRetries} - FHIR API Error:`,
        error.response?.data || error.message
      );
      lastError = error;
    }

    // If this isn't the last attempt, wait before retrying
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(
        `Attempt ${attempt}/${maxRetries} - Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
  throw lastError;
}

app.get("/", (req, res) => {
  const authUrl = `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(
    SCOPES
  )}&state=${STATE}&aud=${encodeURIComponent(FHIR_BASE)}`;

  res.redirect(authUrl);
});
// Entry point
// app.get("/dashboard", (req, res) => {
//     return res.sendFile(__dirname + "/views/index.html");
// });

app.get("/patient-list/:patientId", (req, res) => {
  res.sendFile(__dirname + "/views/patient-list.html");
});

app.get("/login-callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No authorization code received.");
  }
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );

  try {
    console.log("Token request payload:", {
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
    });

    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );

    const { access_token, id_token } = response.data;
    launchContexts.set("access_token", access_token);
    launchContexts.set("id_token", id_token);

    res.sendFile(__dirname + "/views/index.html");
  } catch (error) {
    console.error(
      "Token request error:",
      error.response?.data || error.message
    );
    res.status(500).send("Error exchanging authorization code for tokens");
  }
});

app.get("/scribe/:patientId", (req, res) => {
  const { patientId } = req.params;
  res.sendFile(__dirname + "/views/scribe.html", { patientId });
  // res.sendFile(__dirname + "/views/scribe.html");
});

app.get("/idrs/:patientId", (req, res) => {
  const { patientId } = req.params;
  res.sendFile(__dirname + "/views/idrs.html", { patientId });
});

app.get("/token", async (req, res) => {
  res.json({ access_token: launchContexts.get("MEDWAY_TOKEN") });
});

app.get("/patient/:patientId/data", async (req, res) => {
  const { patientId } = req.params;
  const access_token = launchContexts.get("access_token");

  const medway_client_id = "External-Partner-Org";
  const medway_client_secret = "ZM5ox7nRTyWku7JHXwQBDOqD1fiyNdh6";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const urlencoded_data = new URLSearchParams({
    client_id: medway_client_id,
    client_secret: medway_client_secret,
    grant_type: "client_credentials",
  });

  const medway_token_response = await axios.post(
    "https://keyservicesdev.medway.ai/auth/realms/medwayai/protocol/openid-connect/token",
    urlencoded_data,
    headers
  );

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://apigateway.medway.ai/mw-session-service/api/v1/external/session",
    headers: {
      "Medway-Physician-Id": "e371920b-7a11-440f-86cf-cb313d7f8b09",
      "Content-Type": "application/json",
      Authorization: `Bearer ${medway_token_response.data.access_token}`,
    },
    data: {
      patientId: patientId,
    },
  };

  let user_token = "";

  token_data = axios
    .post(
      "https://apigateway.medway.ai/logic-lane-be/auth/login",
      {
        email: "org1user1@gmail.com",
        password: "Test@123",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      console.log("Token data:", response.data);
      user_token = response.data.token;

      axios
        .request(config)
        .then((response) => {
          sessionId = response.data.data.session.sessionId;
          let responseData = {
            sessionId: sessionId,
            access_token: medway_token_response.data.access_token,
            user_token: user_token,
            patientName: "Patrick King",
          };
          return res.json(responseData);
        })
        .catch((error) => {
          return res
            .status(500)
            .send(`Error creating session: ${error.message}`);
        });
    })
    .catch((error) => {
      console.error("Error getting token data:", error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
      <h2>Page Not Found</h2>
      <p>The requested route was not found.</p>
      <a href="/">Back to Launch</a>
    `);
});

app.listen(process.env.PORT, () => {
  console.log(`SMART App running at http://localhost:${process.env.PORT}`);
});
