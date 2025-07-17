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
const MEDWAY_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqRkx1eGFmaWxidUpKRERSVzZ6akdtdlFyQnNndFlFOFdtc1N4NzVwOXpjIn0.eyJleHAiOjE3NTI3ODU2OTYsImlhdCI6MTc1Mjc1Njg5NiwianRpIjoiMjlhZmEyNzYtYTFkYS00NWRlLWFiOTAtMjI5NGJiOWE4MmZmIiwiaXNzIjoiaHR0cHM6Ly9rZXlzZXJ2aWNlc2Rldi5tZWR3YXkuYWkvcmVhbG1zL21lZHdheWFpIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjY0NWE4NmEwLWMxYTUtNDZhNC1hNWY4LTcxNzBmZWM2OTk2OCIsInR5cCI6IkJlYXJlciIsImF6cCI6IkV4dGVybmFsLVBhcnRuZXItT3JnIiwic2lkIjoiNTM2NTE0ZjItMTU4My00ZTFmLTgxMGYtMWQ0NDFjMjQzNWZmIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtbWVkd2F5YWkiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sIkV4dGVybmFsLVBhcnRuZXItT3JnIjp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19fSwic2NvcGUiOiJwcm9maWxlIGN1c3RvbV9vcmdhbml6YXRpb24gZW1haWwiLCJjbGllbnRIb3N0IjoiMTAyLjIyLjE2Mi4xNTAiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6InNlcnZpY2UiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtZXh0ZXJuYWwtcGFydG5lci1vcmciLCJjdXN0b21fb3JnYW5pemF0aW9uIjoiOTUiLCJnaXZlbl9uYW1lIjoic2VydmljZSIsImNsaWVudEFkZHJlc3MiOiIxMDIuMjIuMTYyLjE1MCIsImVtYWlsIjoic2VydmljZS1hY2NvdW50LWV4dGVybmFsLXBhcnRuZXItb3JnQG1lZHdheS5haSIsImNsaWVudF9pZCI6IkV4dGVybmFsLVBhcnRuZXItT3JnIn0.BCgSmfyJlwxqvDqH0iOp4d-iamaGMhn7rFcquWvHFrBc6RQwXQGm_PFPzA1XnLnhVfeFlLJXKfpxyfMzaNV7qpszd8cy3LGW7v54BPGGz2FBJSJpGvpc-Rs-cH7I8BspEijzSot9ePtTQ6QZ9ijrmeaUcyScVCc2hAgQAaA8f1tBvLvIMUmz7VEGJ11m_q00FZDifkaxFvVJwluNHY75eAyaobWjuOUkvoCFS2DuZjqeKGLrGleMKgOQIqtJa85WeH4dvCVST-AKYkdPFc4JTV2DaNLoAcd8FxFxBythTHN4KpRS34vGAB_e-RJpYrAoqAsvxuWPV-5_e-bfnzbO4g";

// Middleware
app.use(express.json());
app.use(express.static("views"));

// Helper function to make FHIR API calls with retry mechanism
async function makeFhirRequest(url, accessToken, maxRetries = 4) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const baseUrl = FHIR_BASE;
      console.log(`Attempt ${attempt}/${maxRetries} - baseUrl:`, baseUrl);
      console.log(`Attempt ${attempt}/${maxRetries} - url:`, url);
      console.log(`Attempt ${attempt}/${maxRetries} - accessToken:`, accessToken);
      
      const response = await axios.get(`${baseUrl}${url}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/fhir+json",
          "Content-Type": "application/fhir+json",
        },
      });
      
      // Check if status is 200
      if (response.status === 200) {
        console.log(`Attempt ${attempt}/${maxRetries} - Success! Response:`, response.data);
        return response.data;
      } else {
        console.log(`Attempt ${attempt}/${maxRetries} - Non-200 status: ${response.status}`);
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} - FHIR API Error:`, error.response?.data || error.message);
      lastError = error;
    }
    
    // If this isn't the last attempt, wait before retrying
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`Attempt ${attempt}/${maxRetries} - Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed
  console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
  throw lastError;
}

// Entry point
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/auth", (req, res) => {
  const authUrl = `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(
    SCOPES
  )}&state=${STATE}&aud=${encodeURIComponent(FHIR_BASE)}`;

  res.redirect(authUrl);
});

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
  res.sendFile(__dirname + "/views/scribe.html");
});

app.get("/idrs", (req, res) => {
  res.sendFile(__dirname + "/views/idrs.html");
});

app.get("/token", (req, res) => {
  res.json({ access_token: launchContexts.get("access_token") });
});

app.get("/patient/:patientId/data", async (req, res) => {
  const { patientId } = req.params;
  const access_token = launchContexts.get("access_token");
  const observationData = await makeFhirRequest(
    `/Observation?patient=${patientId}&_count=1`,
    access_token
  );
  let sessionData = {
    data: {
      observation: observationData,
    },
  };

  const patient = await makeFhirRequest(`/Patient/${patientId}`, access_token);

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://apigateway.medway.ai/mw-session-service/api/v1/external/session",
    headers: {
      "Medway-Physician-Id": "e371920b-7a11-440f-86cf-cb313d7f8b09",
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEDWAY_TOKEN}`,
    },
    data: sessionData,
  };

  axios
    .request(config)
    .then((response) => {
      sessionId = response.data.data.session.sessionId;
      let responseData = {
        sessionId: sessionId,
        access_token: MEDWAY_TOKEN,
        patientName: patient.name[0].given[0] + " " + patient.name[0].family,
      };
      return res.json(responseData);
    })
    .catch((error) => {
      return res.status(500).send(`Error creating session: ${error.message}`);
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
