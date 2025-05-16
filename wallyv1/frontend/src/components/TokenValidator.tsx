import React, { useState } from "react";
import { roundRobinTokenResolve } from "../utils/tokenSearch"; // Use your frontend utility

const TokenValidator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean, suggestion?: string, symbol?: string } | null>(null);
  const [error, setError] = useState("");

  const validateToken = async () => {
    try {
      const validation = await roundRobinTokenResolve(input);
      setResult(validation);
      setError("");
    } catch (e) {
      setResult(null);
      setError("Token validation failed, please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateToken();
  };

  return (
    <div>
      <h2>Token Validator</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter token address, symbol, or name"
          required
        />
        <button type="submit">Validate</button>
      </form>
      {result && (
        <div>
          {result.valid ? (
            <p style={{ color: "green" }}>Token is valid!</p>
          ) : (
            <p style={{ color: "red" }}>
              Token not found.
              {result.suggestion && (
                <> Did you mean <strong>{result.suggestion} ({result.symbol})</strong>?</>
              )}
            </p>
          )}
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default TokenValidator;