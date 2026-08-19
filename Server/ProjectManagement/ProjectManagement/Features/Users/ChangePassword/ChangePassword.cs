using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Users.ChangePassword;

// 1. Command (طلب تغيير كلمة المرور)
public record ChangePasswordCommand(
    string UserId,
    string CurrentPassword,
    string NewPassword
) : IRequest<ChangePasswordResponseDto>;

// 2. Response DTO (النتيجة)
public record ChangePasswordResponseDto(
    string Message
);

// 3. Handler (المنطق باستخدام ASP.NET Core Identity)
public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, ChangePasswordResponseDto>
{
    private readonly UserManager<User> _userManager;

    public ChangePasswordCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ChangePasswordResponseDto> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        // العثور على المستخدم من خلال الـ ID
        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        // استخدام Identity المدمجة لتغيير كلمة المرور والتحقق من الحالية
        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            // جمع أخطاء Identity (مثل خطأ كلمة المرور الحالية غير صحيحة أو الجديدة لا توفي بالشروط)
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Password change failed: {errors}");
        }

        return new ChangePasswordResponseDto("Password changed successfully.");
    }
}

// 4. Controller (نقطة النهاية ضمن نفس مسار الـ Profile أو Account)
[ApiController]
[Route("api/profile/change-password")]
[Authorize]
public class ChangePasswordController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChangePasswordController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var command = new ChangePasswordCommand(
            userId,
            dto.CurrentPassword,
            dto.NewPassword
        );

        var result = await _mediator.Send(command);

        return Ok(result);
    }
}

// DTO خاص باستقبال البيانات القادمة من الـ Request كـ JSON
public record ChangePasswordRequestDto(
    string CurrentPassword,
    string NewPassword
);