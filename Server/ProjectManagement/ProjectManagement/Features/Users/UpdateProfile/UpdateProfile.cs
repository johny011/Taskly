using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using System.Security.Claims;

namespace ProjectManagement.Features.Users.UpdateProfile;

// 1. Command (طلب التعديل)
public record UpdateProfileCommand(
    string UserId,
    string FullName,
    string Email,
    IFormFile? ProfilePicture
) : IRequest<UpdateProfileResponseDto>;

// 2. Response DTO (النتيجة)
public record UpdateProfileResponseDto(
    string Message,
    string FullName,
    string Email,
    string? ImageUrl
);

// 3. Handler (المنطق)
public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UpdateProfileResponseDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateProfileCommandHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<UpdateProfileResponseDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        // تحديث الحقول النصية
        user.FullName = request.FullName;
        user.Email = request.Email;
        user.UserName = request.Email;

        // معالجة رفع الصورة الشخصية (إن وجدت)
        if (request.ProfilePicture is not null && request.ProfilePicture.Length > 0)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "profiles");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{request.ProfilePicture.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.ProfilePicture.CopyToAsync(stream, cancellationToken);
            }
            var oldPath = Path.Combine(uploadsFolder, user.ImageUrl);
            if (File.Exists(oldPath))
            {
                File.Delete(oldPath);
            }
            user.ImageUrl = $"/images/profiles/{uniqueFileName}";
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new UpdateProfileResponseDto("Profile updated successfully", user.FullName, user.Email, user.ImageUrl);
    }
}

// 4. Controller (نقطة النهاية)
[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPut]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var command = new UpdateProfileCommand(
            userId,
            dto.FullName,
            dto.Email,
            dto.ProfilePicture
        );

        var result = await _mediator.Send(command);

        return Ok(result);
    }
}

// DTO خاص باستقبال البيانات القادمة من Form-Data في الطلب
public record UpdateProfileRequestDto(
    string FullName,
    string Email,
    IFormFile? ProfilePicture
);