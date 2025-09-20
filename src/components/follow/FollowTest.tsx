import React from "react";
import FollowButton from "./FollowButton";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/Store";

const FollowTest: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Follow Button Test</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current User State:</h3>
        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="space-y-4">
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test User 1 (ID: 1)</h3>
          <FollowButton userId={1} username="testuser1" />
        </div>
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test User 2 (ID: 2)</h3>
          <FollowButton userId={2} username="testuser2" />
        </div>
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Simple Button Test</h3>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Simple Button (Should Always Show)
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowTest;
