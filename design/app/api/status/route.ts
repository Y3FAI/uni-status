import { NextResponse } from "next/server"
import type { StatusResponse } from "@/lib/types"

// Simulated status data — in production this would ping Blackboard/SSO
function getStatus(): StatusResponse {
  const minute = new Date().getMinutes()
  const cycle = minute % 15

  if (cycle < 5) {
    // All good
    return {
      canAccessBlackboard: true,
      status: "operational",
      responseTime: 230 + Math.floor(Math.random() * 120),
      lastChecked: new Date().toISOString(),
      services: [
        { name: "SSO / Single Sign-On", status: "operational", description: "The university login gateway that authenticates you before reaching Blackboard.", responseTime: 180 + Math.floor(Math.random() * 60) },
        { name: "Blackboard LMS", status: "operational", description: "The learning management system where you access courses, assignments, and grades.", responseTime: 230 + Math.floor(Math.random() * 120) },
      ],
      incidents: [
        {
          title: "SSO server experienced brief outage",
          status: "resolved",
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        },
      ],
    }
  } else if (cycle < 8) {
    // SSO is down but Blackboard itself is fine
    return {
      canAccessBlackboard: false,
      status: "down",
      responseTime: null,
      lastChecked: new Date().toISOString(),
      services: [
        { name: "SSO / Single Sign-On", status: "down", description: "The university login gateway that authenticates you before reaching Blackboard.", responseTime: null },
        { name: "Blackboard LMS", status: "operational", description: "The learning management system where you access courses, assignments, and grades.", responseTime: 310 + Math.floor(Math.random() * 120) },
      ],
      incidents: [
        {
          title: "SSO login server is unreachable — you cannot log in",
          status: "ongoing",
          startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        },
      ],
    }
  } else if (cycle < 12) {
    // Blackboard degraded, SSO fine
    return {
      canAccessBlackboard: true,
      status: "degraded",
      responseTime: 2400 + Math.floor(Math.random() * 800),
      lastChecked: new Date().toISOString(),
      services: [
        { name: "SSO / Single Sign-On", status: "operational", description: "The university login gateway that authenticates you before reaching Blackboard.", responseTime: 200 + Math.floor(Math.random() * 80) },
        { name: "Blackboard LMS", status: "degraded", description: "The learning management system where you access courses, assignments, and grades.", responseTime: 2400 + Math.floor(Math.random() * 800) },
      ],
      incidents: [
        {
          title: "Blackboard experiencing slow response times",
          status: "ongoing",
          startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
      ],
    }
  } else {
    // Both down
    return {
      canAccessBlackboard: false,
      status: "down",
      responseTime: null,
      lastChecked: new Date().toISOString(),
      services: [
        { name: "SSO / Single Sign-On", status: "down", description: "The university login gateway that authenticates you before reaching Blackboard.", responseTime: null },
        { name: "Blackboard LMS", status: "down", description: "The learning management system where you access courses, assignments, and grades.", responseTime: null },
      ],
      incidents: [
        {
          title: "SSO server is down",
          status: "ongoing",
          startedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        },
        {
          title: "Blackboard completely unreachable",
          status: "ongoing",
          startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ],
    }
  }
}

export async function GET() {
  const status = getStatus()
  return NextResponse.json(status)
}
