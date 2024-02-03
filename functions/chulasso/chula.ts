export const serviceValidation = async (
  ticket: string
) => {
  try {
    const url = "https://account.it.chula.ac.th/serviceValidation";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        DeeAppId: "app.vercel.sci-locker",
        DeeAppSecret:
          "fc42f10ca65ec5a314f3e989dc69a08dc26868814d399c283c5cdb1bce485265ee873fc939305b313df67b155dd29b0a2535c67030fb5fe9e9755007abceace5",
        DeeTicket: ticket,
      },
      mode: "no-cors",
    });
    console.log("finish post");

    if (response.ok) {

      const jsonResponse = await response.text();
      return {
        status: 200,
        message: jsonResponse
      }
    } else {
      console.log("ERROR");

      // Handle non-OK response (e.g., 404, 500, etc.)
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return {
        status : response.status,
        message: response.statusText
      };
    }
  } catch (error) {
    return {
        status : 500,
        message : error
    };
  }
};
