import { useState } from 'react';
    import axios from 'axios';

    const HomePage = () => {
      const [image, setImage] = useState(null);
      const [vehicleData, setVehicleData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [apiResponse, setApiResponse] = useState('');

      const handleImageChange = (event) => {
        const file = event.target.files[0];
        setImage(file);
        setVehicleData(null); // Reset vehicle data when a new image is selected
        setApiResponse(''); // Reset API response when a new image is selected
      };

      const decodeHTMLEntities = (text) => {
        const entities = {
          'amp': '&',
          'lt': '<',
          'gt': '>',
          'quot': '"',
          'apos': "'",
          '#039': "'",
          '#x27': "'",
          '#x2F': '/',
          '#x3D': '=',
          '#x5B': '[',
          '#x5D': ']',
        };
        return text.replace(/&([^;]+);/g, (match, entity) => {
          return entities[entity] || match;
        });
      };

      const removeMarkdown = (text) => {
        // Remove bold (**) and italic (*) formatting
        return text.replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2');
      };

      const handleUpload = async () => {
        if (!image) {
          alert('Please select an image first.');
          return;
        }

        setLoading(true);
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];

          try {
            const response = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: 'Identify the car model, provide specs, pricing, fuel efficiency, and any other relevant details.',
                      },
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            console.log('API Response:', response);

            // Set the raw API response text
            const textResponse = response.data.candidates[0].content.parts[0].text;
            setApiResponse(textResponse); // Set the raw response directly

            // Extract, decode, and remove Markdown from vehicle details
            const extractDetail = (label) => {
              const regex = new RegExp(label + ': (.*?)(?=\\n|$)');
              const match = textResponse.match(regex);
              return match ? removeMarkdown(decodeHTMLEntities(match[1].trim())) : 'Not found';
            };

            setVehicleData({
              model: extractDetail('Model'),
              specs: extractDetail('Specs'),
              pricing: extractDetail('Pricing'),
              fuelEfficiency: extractDetail('Fuel Efficiency'),
            });
          } catch (error) {
            console.error('Error identifying image:', error);
            setVehicleData({ error: 'Failed to identify vehicle.' });
          } finally {
            setLoading(false);
          }
        };

        reader.readAsDataURL(image);
      };

      return (
        <div className="container mt-5">
          <h1 className="mb-4">Vehicle Identification Web App</h1>
          <div className="mb-3">
            <input type="file" className="form-control" onChange={handleImageChange} />
          </div>
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? 'Identifying...' : 'Identify Vehicle'}
          </button>

          {/* Identified Vehicle Details Panel */}
          {vehicleData && (
            <div className="card mt-4">
              <div className="card-header">
                <h2 className="mb-0">Identified Vehicle Details</h2>
              </div>
              <div className="card-body">
                {vehicleData.error ? (
                  <p className="text-danger">{vehicleData.error}</p>
                ) : (
                  <div>
                    {/* Individual Panels for Each Detail */}
                    {vehicleData.model !== 'Not found' && (
                      <div className="card mb-2">
                        <div className="card-header">Model</div>
                        <div className="card-body">{vehicleData.model}</div>
                      </div>
                    )}
                    {vehicleData.specs !== 'Not found' && (
                      <div className="card mb-2">
                        <div className="card-header"><span className="specs-title">Specs</span></div>
                        <div className="card-body">{vehicleData.specs}</div>
                      </div>
                    )}
                    {vehicleData.pricing !== 'Not found' && (
                      <div className="card mb-2">
                        <div className="card-header">Pricing</div>
                        <div className="card-body">{vehicleData.pricing}</div>
                      </div>
                    )}
                    {vehicleData.fuelEfficiency !== 'Not found' && (
                      <div className="card mb-2">
                        <div className="card-header">Fuel Efficiency</div>
                        <div className="card-body">{vehicleData.fuelEfficiency}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API Response Panel */}
          {apiResponse && (
            <div className="card mt-4">
              <div className="card-header">
                <h2 className="mb-0">API Response</h2>
              </div>
              <div className="card-body">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{apiResponse}</pre>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default HomePage;
