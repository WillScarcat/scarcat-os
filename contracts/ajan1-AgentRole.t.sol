// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WillTokenV5} from "./ajan1-WillTokenV5.sol";

// AGENT_ROLE tests — registerAgent/revokeAgent gating, onlyAgent
// restriction on executeIntent, and the guardian-removal /
// stale-approval interaction. Local/Anvil-only, no real keys.
contract AgentRoleTest is Test {
    WillTokenV5 token;

    address guardian1 = address(0x1);
    address guardian2 = address(0x2);
    address guardian3 = address(0x3);
    address agent = address(0xA6E47);
    address treasury = address(0x7EA5);
    address user = address(0xBEEF);

    function setUp() public {
        address[] memory guardians = new address[](3);
        guardians[0] = guardian1;
        guardians[1] = guardian2;
        guardians[2] = guardian3;

        token = new WillTokenV5(1_000_000 ether, treasury, guardians, 2);
    }

    function test_registerAgent_requiresThresholdAndTimelock() public {
        bytes32 salt = keccak256(abi.encode("REGISTER_AGENT", agent));

        // Single approval is not enough (threshold = 2).
        vm.prank(guardian1);
        token.approve(salt);
        vm.expectRevert("insufficient live approvals");
        token.registerAgent(agent);

        // Second approval starts the timelock, but it hasn't elapsed yet.
        vm.prank(guardian2);
        token.approve(salt);
        vm.expectRevert("timelock not elapsed");
        token.registerAgent(agent);

        skip(2 days);
        token.registerAgent(agent);
        assertTrue(token.isAgent(agent));
    }

    function test_onlyAgent_canExecuteIntent() public {
        vm.prank(user);
        vm.expectRevert("not agent");
        token.executeIntent(user, agent, 0, block.timestamp + 1, bytes32(0), "");
    }

    function test_revokedAgent_losesAccess() public {
        _registerAgent(agent);
        assertTrue(token.isAgent(agent));

        bytes32 revokeSalt = keccak256(abi.encode("REVOKE_AGENT", agent));
        vm.prank(guardian1);
        token.approve(revokeSalt);
        vm.prank(guardian2);
        token.approve(revokeSalt);
        skip(2 days);
        token.revokeAgent(agent);

        assertFalse(token.isAgent(agent));
    }

    function test_removedGuardian_approvalStopsCounting() public {
        address guardian4 = address(0x4);

        // The anti-unanimity invariant (guardianCount - 1 > threshold)
        // blocks removal at the bare-minimum 3-guardian/threshold-2 setup
        // from setUp() — a 4th guardian must be added first.
        _setGuardian(guardian4, true, guardian1, guardian2);

        address candidate = address(0xCAFE);
        bytes32 registerSalt = keccak256(abi.encode("REGISTER_AGENT", candidate));

        // guardian1 approves, then gets removed before a second approval
        // arrives — their approval must stop counting toward threshold.
        vm.prank(guardian1);
        token.approve(registerSalt);

        _setGuardian(guardian1, false, guardian2, guardian3);
        assertFalse(token.isGuardian(guardian1));

        vm.prank(guardian2);
        token.approve(registerSalt);

        // Live approvals = [guardian2] only (guardian1 no longer counts) —
        // still below threshold=2.
        vm.expectRevert("insufficient live approvals");
        token.registerAgent(candidate);
    }

    function _registerAgent(address a) internal {
        bytes32 salt = keccak256(abi.encode("REGISTER_AGENT", a));
        vm.prank(guardian1);
        token.approve(salt);
        vm.prank(guardian2);
        token.approve(salt);
        skip(2 days);
        token.registerAgent(a);
    }

    function _setGuardian(address g, bool status, address approver1, address approver2) internal {
        bytes32 salt = keccak256(abi.encode("SET_GUARDIAN", g, status));
        vm.prank(approver1);
        token.approve(salt);
        vm.prank(approver2);
        token.approve(salt);
        skip(2 days);
        token.setGuardian(g, status);
    }
}
