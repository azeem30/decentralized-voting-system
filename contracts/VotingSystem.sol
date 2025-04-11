// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Ballot {
        string title;
        string description;
        string[] options;
        uint256[] votes;
        uint256 startTime;
        uint256 endTime;
        address creator;
        bool isActive;
        mapping(address => bool) hasVoted;
    }

    // Ballots storage
    mapping(uint256 => Ballot) private ballots;
    uint256 private ballotCount;
    
    // Events
    event BallotCreated(uint256 indexed ballotId, string title, address creator);
    event VoteCast(uint256 indexed ballotId, address voter, uint256 optionIndex);
    event BallotEnded(uint256 indexed ballotId);

    /**
     * @dev Create a new ballot
     * @param _title Title of the ballot
     * @param _description Description of the ballot
     * @param _options Array of voting options
     * @param _duration Duration of the ballot in seconds
     * @return ballotId ID of the created ballot
     */
    function createBallot(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _duration
    ) public returns (uint256) {
        require(_options.length >= 2, "At least two options are required");
        require(_duration > 0, "Duration must be greater than zero");
        
        uint256 ballotId = ballotCount;
        Ballot storage ballot = ballots[ballotId];
        
        ballot.title = _title;
        ballot.description = _description;
        ballot.options = _options;
        ballot.votes = new uint256[](_options.length);
        ballot.startTime = block.timestamp;
        ballot.endTime = block.timestamp + _duration;
        ballot.creator = msg.sender;
        ballot.isActive = true;
        
        ballotCount++;
        
        emit BallotCreated(ballotId, _title, msg.sender);
        
        return ballotId;
    }

    /**
     * @dev Cast a vote for a specific option in a ballot
     * @param _ballotId ID of the ballot
     * @param _optionIndex Index of the option to vote for
     */
    function vote(uint256 _ballotId, uint256 _optionIndex) public {
        require(_ballotId < ballotCount, "Ballot does not exist");
        Ballot storage ballot = ballots[_ballotId];
        
        require(ballot.isActive, "Ballot is not active");
        require(block.timestamp <= ballot.endTime, "Ballot has ended");
        require(!ballot.hasVoted[msg.sender], "Already voted");
        require(_optionIndex < ballot.options.length, "Invalid option");
        
        ballot.votes[_optionIndex]++;
        ballot.hasVoted[msg.sender] = true;
        
        emit VoteCast(_ballotId, msg.sender, _optionIndex);
    }

    /**
     * @dev End a ballot before its scheduled end time (only creator can call)
     * @param _ballotId ID of the ballot to end
     */
    function endBallot(uint256 _ballotId) public {
        require(_ballotId < ballotCount, "Ballot does not exist");
        Ballot storage ballot = ballots[_ballotId];
        
        require(msg.sender == ballot.creator, "Only creator can end ballot");
        require(ballot.isActive, "Ballot is already inactive");
        
        ballot.isActive = false;
        ballot.endTime = block.timestamp;
        
        emit BallotEnded(_ballotId);
    }

    /**
     * @dev Get ballot details
     * @param _ballotId ID of the ballot
     * @return title Title of the ballot
     * @return description Description of the ballot
     * @return options Array of voting options
     * @return votes Array of vote counts for each option
     * @return startTime Start time of the ballot
     * @return endTime End time of the ballot
     * @return creator Address of the ballot creator
     * @return isActive Whether the ballot is active
     */
    function getBallot(uint256 _ballotId) public view returns (
        string memory title,
        string memory description,
        string[] memory options,
        uint256[] memory votes,
        uint256 startTime,
        uint256 endTime,
        address creator,
        bool isActive
    ) {
        require(_ballotId < ballotCount, "Ballot does not exist");
        Ballot storage ballot = ballots[_ballotId];
        
        // Check if ballot should be marked as inactive due to time
        bool active = ballot.isActive;
        if (active && block.timestamp > ballot.endTime) {
            active = false;
        }
        
        return (
            ballot.title,
            ballot.description,
            ballot.options,
            ballot.votes,
            ballot.startTime,
            ballot.endTime,
            ballot.creator,
            active
        );
    }

    /**
     * @dev Get IDs of all active ballots
     * @return Array of active ballot IDs
     */
    function getActiveBallots() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active ballots
        for (uint256 i = 0; i < ballotCount; i++) {
            if (ballots[i].isActive && block.timestamp <= ballots[i].endTime) {
                activeCount++;
            }
        }
        
        // Create array of active ballot IDs
        uint256[] memory activeBallotIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < ballotCount; i++) {
            if (ballots[i].isActive && block.timestamp <= ballots[i].endTime) {
                activeBallotIds[index] = i;
                index++;
            }
        }
        
        return activeBallotIds;
    }

    /**
     * @dev Check if a user has voted in a specific ballot
     * @param _ballotId ID of the ballot
     * @param _voter Address of the voter
     * @return Whether the user has voted
     */
    function hasVoted(uint256 _ballotId, address _voter) public view returns (bool) {
        require(_ballotId < ballotCount, "Ballot does not exist");
        return ballots[_ballotId].hasVoted[_voter];
    }

    /**
     * @dev Get the total number of ballots
     * @return Total number of ballots
     */
    function getBallotCount() public view returns (uint256) {
        return ballotCount;
    }
}
