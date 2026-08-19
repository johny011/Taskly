using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Security.Claims;

namespace ProjectManagement.Features.Users.GetProfile;

public record GetProfileQuery(string UserId) : IRequest<GetProfileDto>;

// 2. Response (النتيجة / DTO)
// استخدمنا record لأنها أسرع وأفضل لتمثيل البيانات الثابتة
public record GetProfileDto(string FullName, string Email, string? ImageUrl);

// 3. Handler (المنطق)
public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, GetProfileDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetProfileQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<GetProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        // استخدام ProjectTo يترجم المابينغ مباشرة إلى جملة SQL SELECT
        // مما يعني أن السيرفر سيجلب فقط الـ 3 حقول المطلوبة وليس الكائن كاملاً
        var profile = await _context.Users
            .Where(u => u.Id == request.UserId)
            .ProjectTo<GetProfileDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (profile is null)
        {
            // يمكنك استبدال هذا برمي استثناء مخصص أو استخدام Result Pattern
            throw new KeyNotFoundException("User profile not found.");
        }

        return profile;
    }
}

public class MapperProfile : Profile
{
    public MapperProfile()
    {
        CreateMap<User, GetProfileDto>()
            // Email يتم تحويله تلقائياً لتطابق الاسم
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageUrl));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize] // تأكد أن المستخدم مسجل الدخول
public class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        // استخراج UserId من الـ Token الحالي
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // إرسال الطلب إلى الـ Slice
        var query = new GetProfileQuery(userId);
        var result = await _mediator.Send(query);

        return Ok(result);
    }
}