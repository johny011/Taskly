using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Data;
using ProjectManagement.DTOs;
using ProjectManagement.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ProjectManagement.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<object>> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userByEmail = await _userManager.FindByEmailAsync(model.Email);
        if (userByEmail != null) return BadRequest(new { errors =new string []{ "Email is already registered."} });

        var user = new User { FullName = model.FullName, UserName = model.Email, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            //await _userManager.AddToRoleAsync(user, "User");

            var accessToken = await GenerateJwtToken(user);
            var refreshToken = await GenerateAndStoreRefreshToken(user);

            // نرجع التوكنين معاً في الـ Response Body
            return Ok(new
            {
                token = accessToken,
                refreshToken = refreshToken
            });
        }
        return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
    }

    [HttpPost("login")]
    public async Task<ActionResult<object>> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByNameAsync(model.Email);
        if (user == null) return Unauthorized(new { message = "Invalid credentials" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (!result.Succeeded) return Unauthorized(new { message = "Invalid credentials" });

        var accessToken = await GenerateJwtToken(user);
        var refreshToken = await GenerateAndStoreRefreshToken(user);

        // إرجاع التوكنين في الجسم
        return Ok(new
        {
            token = accessToken,
            refreshToken = refreshToken
        });
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<object>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        // استلام الـ RefreshToken من الـ Body مباشرة
        if (string.IsNullOrEmpty(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .SingleOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.IsUsed || storedToken.ExpiryDate < DateTime.UtcNow)
            return Unauthorized("Invalid, expired or used refresh token.");

        // تدوير التوكن
        storedToken.IsUsed = true;
        _context.RefreshTokens.Update(storedToken);

        var newAccessToken = await GenerateJwtToken(storedToken.User);
        var newRefreshToken = await GenerateAndStoreRefreshToken(storedToken.User);

        return Ok(new
        {
            token = newAccessToken,
            refreshToken = newRefreshToken
        });
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
            return BadRequest("Token is required.");

        var storedToken = await _context.RefreshTokens
            .SingleOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            _context.RefreshTokens.Update(storedToken);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Token revoked successfully." });
    }

    // تخزين Refresh Token في قاعدة البيانات
    private async Task<string> GenerateAndStoreRefreshToken(User user)
    {
        var refreshToken = GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,  // في الإنتاج: قم بتشفيره (Hash) مع Salt
            JwtId = Guid.NewGuid().ToString(),
            ExpiryDate = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:RefreshTokenExpirationDays"])),
            IsRevoked = false,
            IsUsed = false,
            UserId = user.Id
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return refreshToken;
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<string> GenerateJwtToken(User user)
    {
        var userClaims = await _userManager.GetClaimsAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Name, user.UserName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim("imageUrl", user.ImageUrl),

        }
        .Union(userClaims)
        .Union(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiration = DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:DurationInMinutes"]));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; }
}