using Microsoft.AspNetCore.Authorization;

namespace ProjectManagement.AccessRequirement;

public class TaskAccessRequirement : IAuthorizationRequirement
{
    public bool RequireOwner { get; set; }   
    public bool RequireManager { get; set; } 
    public bool RequireMember { get; set; }  
}