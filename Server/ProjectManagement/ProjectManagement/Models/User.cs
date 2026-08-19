using Microsoft.AspNetCore.Identity;

namespace ProjectManagement.Models;

public class User:IdentityUser  
{
    public string FullName { get; set; }
    public string ImageUrl { get; set; }
}
